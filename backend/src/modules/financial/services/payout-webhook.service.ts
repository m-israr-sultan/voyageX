import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import {
  LedgerEntryStatus,
  LedgerType,
  PayoutStatus,
  Prisma,
  WebhookEventType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayoutGatewayFactory } from '../providers/payout-gateway.factory';
import { PayoutProvider } from '@prisma/client';
import { FinancialCompletionService } from './financial-completion.service';
import { NotificationService } from '../../services/notification.service';
import { WebhookEventService } from './webhook-event.service';

function mapPayoutProvider(provider: string): PayoutProvider | null {
  const map: Record<string, PayoutProvider> = {
    easypaisa: PayoutProvider.EASYPAISA,
    jazzcash: PayoutProvider.JAZZCASH,
    bank: PayoutProvider.BANK,
    'bank-account': PayoutProvider.BANK,
  };
  return map[provider.toLowerCase()] ?? null;
}

@Injectable()
export class PayoutWebhookService {
  private readonly logger = new Logger(PayoutWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateways: PayoutGatewayFactory,
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
    const payoutProvider = mapPayoutProvider(provider);
    if (!payoutProvider) {
      this.logger.warn(`Unknown payout webhook provider: ${provider}`);
      return { received: true };
    }

    const gateway = this.gateways.getGateway(payoutProvider);
    if (!gateway.verifyWebhook(headers, body)) {
      this.audit.log({
        action: 'payout.webhook_signature_failed',
        actorId: 'SYSTEM',
        resourceType: 'webhook',
        resourceId: provider,
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const parsed = await gateway.processWebhook(body);
    const eventId = parsed.providerReference || `payout-${Date.now()}`;

    const registration = await this.webhooks.register(
      WebhookEventType.PAYOUT,
      provider,
      eventId,
      body,
    );
    if (registration.isDuplicate) {
      return { received: true };
    }

    await this.webhooks.markVerified(registration.eventId);
    this.audit.log({
      action: 'payout.webhook_verified',
      actorId: 'SYSTEM',
      resourceType: 'webhook',
      resourceId: registration.eventId,
      metadata: { provider, providerReference: eventId },
    });

    const started = Date.now();
    await this.webhooks.markProcessing(registration.eventId);
    this.processAsync(payoutProvider, parsed, registration.eventId, started).catch(async (err) => {
      const msg = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`Payout webhook failed: ${msg}`);
      await this.webhooks.markFailed(registration.eventId, msg, Date.now() - started);
    });

    return { received: true };
  }

  async reprocessStoredEvent(eventId: string): Promise<void> {
    const event = await this.webhooks.getEvent(eventId);
    if (!event?.payload) return;
    const payoutProvider = mapPayoutProvider(event.provider);
    if (!payoutProvider) return;
    const gateway = this.gateways.getGateway(payoutProvider);
    const parsed = await gateway.processWebhook(event.payload);
    const started = Date.now();
    await this.webhooks.markProcessing(eventId);
    await this.processAsync(payoutProvider, parsed, eventId, started);
  }

  private async processAsync(
    provider: PayoutProvider,
    parsed: {
      providerReference: string;
      status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'CANCELLED';
      amount: number;
    },
    webhookEventId: string,
    startedAt = Date.now(),
  ): Promise<void> {
    const payout = await this.prisma.guide_payouts.findFirst({
      where: {
        OR: [
          { providerReference: parsed.providerReference },
          { voyagexReference: parsed.providerReference },
        ],
        provider,
      },
      include: { guides: true },
    });

    if (!payout) {
      this.logger.warn(`No payout for providerReference=${parsed.providerReference}`);
      return;
    }

    if (parsed.status === 'PROCESSING') {
      if (payout.status !== PayoutStatus.SUCCESS) {
        await this.prisma.guide_payouts.update({
          where: { id: payout.id },
          data: { status: PayoutStatus.PROCESSING, updatedAt: new Date() },
        });
      }
      await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
      return;
    }

    if (parsed.status === 'CANCELLED') {
      if (payout.status !== PayoutStatus.SUCCESS) {
        await this.prisma.guide_payouts.update({
          where: { id: payout.id },
          data: {
            status: PayoutStatus.CANCELLED,
            failureReason: 'Cancelled by provider',
            updatedAt: new Date(),
          },
        });
      }
      await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
      return;
    }

    if (parsed.status === 'FAILED') {
      if (payout.status !== PayoutStatus.SUCCESS) {
        await this.prisma.guide_payouts.update({
          where: { id: payout.id },
          data: {
            status: PayoutStatus.FAILED,
            failureReason: 'Provider reported failure',
            failedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        await this.notifications.notifyPayoutFailed(
          payout.guides.userId,
          payout.netAmount,
          payout.bookingId,
          'Provider reported failure',
        );
      }
      await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
      return;
    }

    if (parsed.status === 'SUCCESS') {
      if (payout.status === PayoutStatus.SUCCESS) {
        await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.guide_payouts.update({
          where: { id: payout.id },
          data: {
            status: PayoutStatus.SUCCESS,
            providerReference: parsed.providerReference,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await this.postPayoutLedgerIfNeeded(tx, payout);
      });

      await this.completion.completeGuidePayout(payout.id);
      await this.notifications.notifyPayoutCompleted(
        payout.guides.userId,
        payout.netAmount,
        payout.bookingId,
      );

      this.audit.log({
        action: 'payout.confirmed',
        actorId: 'SYSTEM',
        resourceType: 'guide_payout',
        resourceId: payout.id,
        metadata: { providerReference: parsed.providerReference },
      });
    }

    await this.webhooks.markProcessed(webhookEventId, Date.now() - startedAt);
  }

  private async postPayoutLedgerIfNeeded(
    tx: Prisma.TransactionClient,
    payout: {
      id: string;
      bookingId: string;
      paymentId: string;
      guideId: string;
      grossAmount: number;
      commissionAmount: number;
      netAmount: number;
      currency: string;
    },
  ): Promise<void> {
    const types: LedgerType[] = [
      LedgerType.ESCROW_RELEASE,
      LedgerType.COMMISSION,
      LedgerType.GUIDE_PAYOUT,
    ];
    for (const ledgerType of types) {
      const key = `payout:${payout.id}:${ledgerType}`;
      const existing = await tx.financial_ledger.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) continue;

      const amount =
        ledgerType === LedgerType.GUIDE_PAYOUT
          ? payout.netAmount
          : ledgerType === LedgerType.COMMISSION
            ? payout.commissionAmount
            : payout.grossAmount;

      if (ledgerType === LedgerType.COMMISSION && payout.commissionAmount <= 0) continue;

      await tx.financial_ledger.create({
        data: {
          id: randomUUID(),
          ledgerType,
          bookingId: payout.bookingId,
          paymentId: payout.paymentId,
          payoutId: payout.id,
          userId: payout.guideId,
          amount,
          currency: payout.currency,
          status: LedgerEntryStatus.POSTED,
          remarks: `Payout webhook: ${ledgerType}`,
          referenceNumber: `VX-LEDGER-${Date.now()}-${randomUUID().slice(0, 8)}`,
          idempotencyKey: key,
          createdBy: 'SYSTEM',
        },
      });
    }
  }
}
