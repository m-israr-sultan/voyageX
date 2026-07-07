import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  Prisma,
  WebhookEventType,
  WebhookProcessingStatus,
} from '@prisma/client';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { PayoutWebhookService } from './payout-webhook.service';
import { SubscriptionWebhookService } from './subscription-webhook.service';
import { WebhookEventService } from './webhook-event.service';

@Injectable()
export class WebhookOperationsService {
  private readonly logger = new Logger(WebhookOperationsService.name);
  private readonly maxRetries = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhookEventService,
    private readonly moduleRef: ModuleRef,
    private readonly audit: AuditService,
  ) {}

  async listEvents(query: {
    page?: number;
    limit?: number;
    provider?: string;
    status?: string;
    eventType?: string;
    search?: string;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 25, 100);
    const where: Prisma.webhook_eventsWhereInput = {};
    if (query.provider) where.provider = query.provider;
    if (query.status) where.processingStatus = query.status as WebhookProcessingStatus;
    if (query.eventType) where.eventType = query.eventType as WebhookEventType;

    const [items, total] = await Promise.all([
      this.prisma.webhook_events.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webhook_events.count({ where }),
    ]);

    return {
      items: items.map((e) => ({
        ...e,
        replayProtected: e.verified,
        payloadPreview: this.summarizePayload(e.payload),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reprocessEvent(eventId: string, adminId: string) {
    const event = await this.prisma.webhook_events.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Webhook event not found');
    if (event.retryCount >= this.maxRetries) {
      throw new Error('Maximum webhook retry count exceeded');
    }

    const started = Date.now();
    await this.webhooks.markProcessing(eventId);

    try {
      if (event.eventType === WebhookEventType.PAYMENT) {
        const svc = this.moduleRef.get(PaymentWebhookService, { strict: false });
        await svc.reprocessStoredEvent(eventId);
      } else if (event.eventType === WebhookEventType.PAYOUT) {
        const svc = this.moduleRef.get(PayoutWebhookService, { strict: false });
        await svc.reprocessStoredEvent(eventId);
      } else if (event.eventType === WebhookEventType.SUBSCRIPTION) {
        const svc = this.moduleRef.get(SubscriptionWebhookService, { strict: false });
        await svc.reprocessStoredEvent(eventId);
      }

      await this.prisma.webhook_events.update({
        where: { id: eventId },
        data: {
          processingStatus: WebhookProcessingStatus.REPLAYED,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
          processingTimeMs: Date.now() - started,
        },
      });

      this.audit.log({
        action: 'financial.webhook.reprocessed',
        actorId: adminId,
        resourceType: 'webhook_event',
        resourceId: eventId,
      });

      return { success: true, eventId };
    } catch (error: unknown) {
      await this.webhooks.markFailed(
        eventId,
        error instanceof Error ? error.message : 'reprocess failed',
        Date.now() - started,
      );
      throw error;
    }
  }

  async retryFailedEvents(): Promise<number> {
    const failed = await this.prisma.webhook_events.findMany({
      where: {
        processingStatus: WebhookProcessingStatus.FAILED,
        retryCount: { lt: this.maxRetries },
        processedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    let recovered = 0;
    for (const event of failed) {
      try {
        await this.reprocessEvent(event.id, 'SYSTEM');
        recovered++;
      } catch (error: unknown) {
        this.logger.warn(
          `Webhook recovery failed id=${event.id}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
    return recovered;
  }

  private summarizePayload(payload: Prisma.JsonValue | null): Record<string, unknown> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return {};
    }
    const obj = payload as Record<string, unknown>;
    return {
      status: obj.status,
      amount: obj.amount,
      transactionId: obj.transactionId ?? obj.providerTransactionId,
      reference: obj.reference ?? obj.providerReference,
    };
  }
}
