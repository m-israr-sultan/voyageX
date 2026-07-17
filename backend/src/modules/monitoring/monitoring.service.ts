import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagesGateway } from '../gateways/messages.gateway';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { getApiLatencyStats } from './api-latency.buffer';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface ProbeResult {
  status: 'up' | 'down' | 'degraded' | 'not_configured';
  responseTimeMs?: number;
  detail?: string;
}

/**
 * Phase O — operational monitoring for founders/admins. Reuses existing
 * infrastructure (webhook_events, refunds, guide_payouts, WS gateways)
 * rather than standing up a new monitoring stack — no @nestjs/terminus,
 * no external uptime SaaS.
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly bootTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly messagesGateway: MessagesGateway,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getHealth() {
    const [database, storage] = await Promise.all([this.probeDatabase(), this.probeStorage()]);
    const websocket = this.probeWebsockets();
    const backgroundJobs = await this.getBackgroundJobsStatus();
    const apiLatency = getApiLatencyStats();

    const warnings: string[] = [];
    if (database.status !== 'up') warnings.push('Database connection is unhealthy.');
    if (database.responseTimeMs && database.responseTimeMs > 1000) {
      warnings.push(`Database response time is elevated (${database.responseTimeMs}ms).`);
    }
    if (storage.status === 'down' || storage.status === 'degraded') {
      warnings.push('Supabase storage appears unreachable — image uploads/rendering may fail.');
    }
    if (apiLatency.p95Ms && apiLatency.p95Ms > 2000) {
      warnings.push(`API p95 latency is elevated (${apiLatency.p95Ms}ms over last ${apiLatency.sampleCount} requests).`);
    }
    if (backgroundJobs.webhooks.last24h.failed > 0) {
      warnings.push(`${backgroundJobs.webhooks.last24h.failed} webhook event(s) failed processing in the last 24h.`);
    }
    if (backgroundJobs.failedPayouts24h > 0) {
      warnings.push(`${backgroundJobs.failedPayouts24h} guide payout(s) failed in the last 24h.`);
    }
    if (backgroundJobs.failedRefunds24h > 0) {
      warnings.push(`${backgroundJobs.failedRefunds24h} refund(s) failed in the last 24h.`);
    }

    return {
      version: this.getVersion(),
      environment: this.config.get<string>('NODE_ENV') ?? 'development',
      timestamp: new Date(),
      uptimeSeconds: Math.floor((Date.now() - this.bootTime) / 1000),
      database,
      storage,
      websocket,
      apiLatency,
      backgroundJobs,
      // Email delivery is not yet persisted anywhere in the schema — surfaced
      // explicitly as "not tracked" rather than fabricating a status.
      emailDelivery: { status: 'not_tracked' as const, detail: 'No persisted email delivery log exists yet.' },
      warnings,
    };
  }

  private getVersion(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require('../../../package.json');
      return pkg.version ?? 'unknown';
    } catch {
      return process.env.npm_package_version ?? 'unknown';
    }
  }

  private async probeDatabase(): Promise<ProbeResult> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', responseTimeMs: Date.now() - started };
    } catch (error) {
      this.logger.error(`Database health probe failed: ${(error as Error).message}`);
      return { status: 'down', responseTimeMs: Date.now() - started, detail: (error as Error).message };
    }
  }

  private async probeStorage(): Promise<ProbeResult> {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    if (!supabaseUrl) return { status: 'not_configured' };

    const started = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${supabaseUrl}/storage/v1/`, { signal: controller.signal });
      clearTimeout(timeout);
      const responseTimeMs = Date.now() - started;
      // Supabase returns 200/404 for this probe path depending on version — any
      // response at all means the host is reachable; only network errors are "down".
      return { status: res.status < 500 ? 'up' : 'degraded', responseTimeMs };
    } catch (error) {
      return { status: 'down', responseTimeMs: Date.now() - started, detail: (error as Error).message };
    }
  }

  private probeWebsockets() {
    const describe = (server: unknown) => {
      const s = server as { engine?: { clientsCount?: number } } | undefined;
      if (!s) return { status: 'down' as const, connectedClients: 0 };
      return { status: 'up' as const, connectedClients: s.engine?.clientsCount ?? 0 };
    };
    return {
      messages: describe(this.messagesGateway.server),
      notifications: describe(this.notificationsGateway.server),
    };
  }

  private async getBackgroundJobsStatus() {
    const since24h = new Date(Date.now() - DAY_MS);

    const [statusGroups, recentFailures, failedPayouts24h, failedRefunds24h] = await Promise.all([
      this.prisma.webhook_events.groupBy({
        by: ['processingStatus'],
        where: { createdAt: { gte: since24h } },
        _count: { _all: true },
      }),
      this.prisma.webhook_events.findMany({
        where: { processingStatus: 'FAILED', createdAt: { gte: since24h } },
        select: { id: true, provider: true, eventType: true, failureReason: true, retryCount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.guide_payouts.count({ where: { status: 'FAILED', updatedAt: { gte: since24h } } }),
      this.prisma.refunds.count({ where: { status: 'FAILED', updatedAt: { gte: since24h } } }),
    ]);

    const counts = { received: 0, verified: 0, processing: 0, processed: 0, failed: 0, replayed: 0 };
    for (const g of statusGroups) {
      const key = g.processingStatus.toLowerCase() as keyof typeof counts;
      if (key in counts) counts[key] = g._count._all;
    }

    return {
      webhooks: { last24h: counts, recentFailures },
      failedPayouts24h,
      failedRefunds24h,
    };
  }
}
