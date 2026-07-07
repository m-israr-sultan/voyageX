import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PaymentMethod, WebhookEventType } from '@prisma/client';
import { PLATFORM_CONFIG } from '../../../common/config/platform.config';
import { AuditService } from '../../../common/services/audit.service';
import { PaymentProviderFactory } from '../../payments/providers/payment-provider.factory';
import { CoreService } from '../../services/core.service';
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
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly webhooks: WebhookEventService,
    private readonly completion: FinancialCompletionService,
    private readonly audit: AuditService,
  ) {}

  async handle(
    provider: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<{ received: boolean }> {
    const method = mapProviderToMethod(provider);
    if (!method) {
      this.logger.warn(`Unknown payment webhook provider: ${provider}`);
      return { received: true };
    }

    const factory = this.moduleRef.get(PaymentProviderFactory, { strict: false });
    const providerService = factory.getProvider(method);
    if (!providerService.verifyWebhook(headers, body)) {
      this.audit.log({
        action: 'payment.webhook_signature_failed',
        actorId: 'SYSTEM',
        resourceType: 'webhook',
        resourceId: provider,
        metadata: { provider },
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const result = await providerService.processWebhook(body);
    const eventId = result.providerTransactionId || `unknown-${Date.now()}`;

    const registration = await this.webhooks.register(
      WebhookEventType.PAYMENT,
      provider,
      eventId,
      body,
    );
    if (registration.isDuplicate) {
      this.logger.log(`Duplicate payment webhook ignored: ${eventId}`);
      return { received: true };
    }

    await this.webhooks.markVerified(registration.eventId);
    this.audit.log({
      action: 'payment.webhook_verified',
      actorId: 'SYSTEM',
      resourceType: 'webhook',
      resourceId: registration.eventId,
      metadata: { provider, providerTransactionId: eventId },
    });

    const payload = body as { timestamp?: number; merchantId?: string };
    if (!PLATFORM_CONFIG.sandboxMode) {
      if (payload.timestamp && this.webhooks.isReplayTimestamp(payload.timestamp)) {
        this.logger.warn(`Replay attack rejected for payment webhook ${eventId}`);
        return { received: true };
      }
    }

    const started = Date.now();
    await this.webhooks.markProcessing(registration.eventId);
    this.processAsync(body, provider, registration.eventId, result, started).catch(async (err) => {
      const msg = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`Payment webhook processing failed: ${msg}`);
      await this.webhooks.markFailed(registration.eventId, msg, Date.now() - started);
    });

    return { received: true };
  }

  async reprocessStoredEvent(eventId: string): Promise<void> {
    const event = await this.webhooks.getEvent(eventId);
    if (!event?.payload) return;
    const factory = this.moduleRef.get(PaymentProviderFactory, { strict: false });
    const method = mapProviderToMethod(event.provider);
    if (!method) return;
    const providerService = factory.getProvider(method);
    const parsed = await providerService.processWebhook(event.payload);
    const started = Date.now();
    await this.webhooks.markProcessing(eventId);
    await this.processAsync(event.payload, event.provider, eventId, parsed, started);
  }

  private async processAsync(
    body: unknown,
    provider: string,
    webhookEventId: string,
    parsed: { providerTransactionId: string; status: string },
    startedAt = Date.now(),
  ): Promise<void> {
    if (!parsed.providerTransactionId) return;

    const core = this.moduleRef.get(CoreService, { strict: false });
    const payment = await core.findPaymentByProviderTxnId(parsed.providerTransactionId);
    if (!payment) {
      this.logger.warn(`No payment for providerTransactionId=${parsed.providerTransactionId}`);
      return;
    }

    if (parsed.status === 'SUCCESS') {
      await core.webhookConfirmPayment(payment.id, parsed.providerTransactionId);
      await this.completion.completeTravelerPayment(payment.id);
      this.audit.log({
        action: 'payment.confirmed',
        actorId: 'SYSTEM',
        resourceType: 'payment',
        resourceId: payment.id,
        metadata: { provider, providerTransactionId: parsed.providerTransactionId },
      });
    } else if (parsed.status === 'FAILED') {
      await core.webhookFailPayment(payment.id);
    }

    await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
  }
}
