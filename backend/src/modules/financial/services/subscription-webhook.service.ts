import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  SubscriptionPaymentStatus,
  WebhookEventType,
  PaymentMethod,
} from '@prisma/client';
import { PLATFORM_CONFIG } from '../../../common/config/platform.config';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentProviderFactory } from '../../payments/providers/payment-provider.factory';
import { NotificationService } from '../../services/notification.service';
import { FinancialCompletionService } from './financial-completion.service';
import { WebhookEventService } from './webhook-event.service';

function mapProviderToMethod(provider: string): PaymentMethod | null {
  const map: Record<string, PaymentMethod> = {
    easypaisa: PaymentMethod.EASYPAISA,
    jazzcash: PaymentMethod.JAZZCASH,
    card: PaymentMethod.CARD,
    'bank-transfer': PaymentMethod.BANK_TRANSFER,
    bank: PaymentMethod.BANK_TRANSFER,
  };
  return map[provider.toLowerCase()] ?? null;
}

@Injectable()
export class SubscriptionWebhookService {
  private readonly logger = new Logger(SubscriptionWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
    private readonly webhooks: WebhookEventService,
    private readonly completion: FinancialCompletionService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  async handle(
    provider: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<{ received: boolean }> {
    const method = mapProviderToMethod(provider);
    if (!method) {
      return { received: true };
    }

    const factory = this.moduleRef.get(PaymentProviderFactory, { strict: false });
    const providerService = factory.getProvider(method);
    if (!providerService.verifyWebhook(headers, body)) {
      this.audit.log({
        action: 'subscription.webhook_signature_failed',
        actorId: 'SYSTEM',
        resourceType: 'webhook',
        resourceId: provider,
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const parsed = await providerService.processWebhook(body);
    const eventId = parsed.providerTransactionId || `sub-${Date.now()}`;

    const registration = await this.webhooks.register(
      WebhookEventType.SUBSCRIPTION,
      provider,
      eventId,
      body,
    );
    if (registration.isDuplicate) {
      return { received: true };
    }

    await this.webhooks.markVerified(registration.eventId);
    this.audit.log({
      action: 'subscription.webhook_verified',
      actorId: 'SYSTEM',
      resourceType: 'webhook',
      resourceId: registration.eventId,
      metadata: { provider },
    });

    const started = Date.now();
    await this.webhooks.markProcessing(registration.eventId);
    this.processAsync(parsed, registration.eventId, started).catch(async (err) => {
      const msg = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`Subscription webhook failed: ${msg}`);
      await this.webhooks.markFailed(registration.eventId, msg, Date.now() - started);
    });

    return { received: true };
  }

  async reprocessStoredEvent(eventId: string): Promise<void> {
    const event = await this.webhooks.getEvent(eventId);
    if (!event?.payload) return;
    const method = mapProviderToMethod(event.provider);
    if (!method) return;
    const factory = this.moduleRef.get(PaymentProviderFactory, { strict: false });
    const providerService = factory.getProvider(method);
    const parsed = await providerService.processWebhook(event.payload);
    const started = Date.now();
    await this.webhooks.markProcessing(eventId);
    await this.processAsync(parsed, eventId, started);
  }

  private async processAsync(
    parsed: { providerTransactionId: string; status: string },
    webhookEventId: string,
    startedAt = Date.now(),
  ): Promise<void> {
    if (!parsed.providerTransactionId) return;

    const payment = await this.prisma.agency_subscription_payments.findFirst({
      where: { transactionId: parsed.providerTransactionId },
      include: { agencies: true },
    });

    if (!payment) {
      this.logger.warn(`No subscription payment for txn=${parsed.providerTransactionId}`);
      return;
    }

    if (payment.status === SubscriptionPaymentStatus.APPROVED) {
      await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
      return;
    }

    if (parsed.status === 'SUCCESS') {
      await this.prisma.agency_subscription_payments.update({
        where: { id: payment.id },
        data: { status: SubscriptionPaymentStatus.APPROVED },
      });

      await this.prisma.agencies.update({
        where: { id: payment.agencyId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: payment.periodStart,
          subscriptionEndDate: payment.periodEnd,
          updatedAt: new Date(),
        },
      });

      await this.notifications.notifyAgencySubscriptionConfirmed(
        payment.agencies.userId,
        payment.agencies.name,
        payment.periodEnd,
      );

      await this.completion.completeSubscriptionPayment(payment.id);

      this.audit.log({
        action: 'subscription.activated',
        actorId: 'SYSTEM',
        resourceType: 'agency_subscription_payment',
        resourceId: payment.id,
        metadata: { via: 'webhook', sandbox: PLATFORM_CONFIG.sandboxMode },
      });
    } else if (parsed.status === 'FAILED') {
      await this.prisma.agency_subscription_payments.update({
        where: { id: payment.id },
        data: {
          status: SubscriptionPaymentStatus.REJECTED,
          rejectionReason: 'Gateway reported payment failure',
        },
      });
    }

    await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
  }
}
