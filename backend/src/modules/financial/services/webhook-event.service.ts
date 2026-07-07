import { Injectable } from '@nestjs/common';
import { WebhookEventType, WebhookProcessingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';

export type RegisterWebhookResult =
  | { isDuplicate: true; eventId: string }
  | { isDuplicate: false; eventId: string };

@Injectable()
export class WebhookEventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async register(
    eventType: WebhookEventType,
    provider: string,
    providerEventId: string,
    payload: unknown,
  ): Promise<RegisterWebhookResult> {
    const existing = await this.prisma.webhook_events.findUnique({
      where: {
        eventType_provider_providerEventId: {
          eventType,
          provider,
          providerEventId,
        },
      },
    });

    if (existing) {
      return { isDuplicate: true, eventId: existing.id };
    }

    const event = await this.prisma.webhook_events.create({
      data: {
        id: randomUUID(),
        eventType,
        provider,
        providerEventId,
        payload: payload as object,
        verified: false,
        processingStatus: WebhookProcessingStatus.RECEIVED,
      },
    });

    const auditAction =
      eventType === WebhookEventType.PAYMENT
        ? 'payment.webhook_received'
        : eventType === WebhookEventType.PAYOUT
          ? 'payout.webhook_received'
          : 'subscription.webhook_received';

    this.audit.log({
      action: auditAction,
      actorId: 'SYSTEM',
      resourceType: 'webhook_event',
      resourceId: event.id,
      metadata: { provider, providerEventId, eventType },
    });

    return { isDuplicate: false, eventId: event.id };
  }

  async markVerified(eventId: string): Promise<void> {
    await this.prisma.webhook_events.update({
      where: { id: eventId },
      data: { verified: true, processingStatus: WebhookProcessingStatus.VERIFIED },
    });
  }

  async markProcessing(eventId: string): Promise<void> {
    await this.prisma.webhook_events.update({
      where: { id: eventId },
      data: { processingStatus: WebhookProcessingStatus.PROCESSING },
    });
  }

  async markProcessed(eventId: string, processingTimeMs?: number): Promise<void> {
    await this.prisma.webhook_events.update({
      where: { id: eventId },
      data: {
        processedAt: new Date(),
        verified: true,
        processingStatus: WebhookProcessingStatus.PROCESSED,
        processingTimeMs,
      },
    });
  }

  async markFailed(eventId: string, reason: string, processingTimeMs?: number): Promise<void> {
    await this.prisma.webhook_events.update({
      where: { id: eventId },
      data: {
        processingStatus: WebhookProcessingStatus.FAILED,
        failureReason: reason,
        processingTimeMs,
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
      },
    });
  }

  isReplayTimestamp(timestampMs: number, maxAgeMs = 300_000): boolean {
    const age = Date.now() - timestampMs;
    return age < 0 || age > maxAgeMs;
  }

  async getEvent(eventId: string) {
    return this.prisma.webhook_events.findUnique({ where: { id: eventId } });
  }
}
