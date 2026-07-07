import { Injectable } from '@nestjs/common';
import {
  LedgerType,
  PaymentStatus,
  PayoutStatus,
  Prisma,
  SubscriptionPaymentStatus,
  WebhookProcessingStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { FinancialSettingsService } from './financial-settings.service';
import { GatewayConfigService } from './gateway-config.service';
import { ReconciliationService } from './reconciliation.service';

export type FinancialMetricsQuery = {
  from?: Date;
  to?: Date;
  provider?: string;
  guideId?: string;
  agencyId?: string;
  status?: string;
};

@Injectable()
export class FinancialMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: FinancialSettingsService,
    private readonly gateways: GatewayConfigService,
    private readonly reconciliation: ReconciliationService,
  ) {}

  async getDashboard(query: FinancialMetricsQuery) {
    const from = query.from ?? new Date(Date.now() - 30 * 86_400_000);
    const to = query.to ?? new Date();
    const paymentWhere: Prisma.paymentsWhereInput = {
      createdAt: { gte: from, lte: to },
      status: {
        in: [
          PaymentStatus.HELD,
          PaymentStatus.RELEASED,
          PaymentStatus.CONFIRMED,
          PaymentStatus.REFUNDED,
        ],
      },
    };
    if (query.provider) paymentWhere.method = query.provider as Prisma.EnumPaymentMethodFilter;

    const payoutWhere: Prisma.guide_payoutsWhereInput = {
      createdAt: { gte: from, lte: to },
    };
    if (query.provider) payoutWhere.provider = query.provider as Prisma.EnumPayoutProviderFilter;
    if (query.guideId) payoutWhere.guideId = query.guideId;

    const [
      gmvAgg,
      commissionAgg,
      guidePayoutsAgg,
      pendingEscrowAgg,
      pendingPayoutsCount,
      completedPayoutsAgg,
      failedPayoutsCount,
      subscriptionAgg,
      refundAgg,
      webhookFailures,
      openReconciliationIssues,
      dailyRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.payments.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.financial_ledger.aggregate({
        where: {
          ledgerType: LedgerType.COMMISSION,
          createdAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.guide_payouts.aggregate({
        where: { ...payoutWhere, status: PayoutStatus.SUCCESS },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.payments.aggregate({
        where: { status: PaymentStatus.HELD },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.guide_payouts.count({
        where: {
          status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
        },
      }),
      this.prisma.guide_payouts.aggregate({
        where: { status: PayoutStatus.SUCCESS, createdAt: { gte: from, lte: to } },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.guide_payouts.count({
        where: { status: PayoutStatus.FAILED, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.agency_subscription_payments.aggregate({
        where: {
          status: SubscriptionPaymentStatus.APPROVED,
          createdAt: { gte: from, lte: to },
          ...(query.agencyId ? { agencyId: query.agencyId } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.refunds.aggregate({
        where: { processedAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.webhook_events.count({
        where: {
          processingStatus: WebhookProcessingStatus.FAILED,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.reconciliation.getOpenIssueCount(),
      this.getDailyRevenue(from, to),
      this.getMonthlyRevenue(from, to),
    ]);

    const gmv = gmvAgg._sum.amount ?? 0;
    const platformRevenue = commissionAgg._sum.amount ?? 0;
    const guideEarnings = guidePayoutsAgg._sum.netAmount ?? 0;
    const agencySubscriptionRevenue = subscriptionAgg._sum.amount ?? 0;
    const refundTotals = refundAgg._sum.amount ?? 0;

    const accounting = {
      gmv,
      platformRevenue,
      guideEarnings,
      agencySubscriptionRevenue,
      refundTotals,
      commissionRevenue: platformRevenue,
      marketplaceVolume: gmv,
      voyagexRevenue: platformRevenue + agencySubscriptionRevenue,
      vatAmount: null as number | null,
      taxAmount: null as number | null,
      currency: this.settings.getCurrency(),
    };

    await this.persistAccountingSnapshot(from, to, accounting);

    return {
      period: { from, to },
      gmv,
      platformCommissionRevenue: platformRevenue,
      guidePayouts: guideEarnings,
      pendingEscrow: {
        amount: pendingEscrowAgg._sum.amount ?? 0,
        count: pendingEscrowAgg._count,
      },
      pendingPayouts: pendingPayoutsCount,
      completedPayouts: {
        amount: completedPayoutsAgg._sum.netAmount ?? 0,
        count: completedPayoutsAgg._count,
      },
      failedPayouts: failedPayoutsCount,
      agencySubscriptionRevenue,
      refundTotals,
      refundCount: refundAgg._count,
      dailyRevenue,
      monthlyRevenue,
      outstandingReconciliationIssues: openReconciliationIssues,
      webhookFailures,
      providerHealth: this.gateways.getProviderHealth(),
      sandboxMode: this.settings.getSandboxMode(),
      accounting,
    };
  }

  async exportDashboard(query: FinancialMetricsQuery, adminId: string) {
    const data = await this.getDashboard(query);
    const rows = [
      ['Metric', 'Value'],
      ['GMV', String(data.gmv)],
      ['Platform Commission Revenue', String(data.platformCommissionRevenue)],
      ['Guide Payouts', String(data.guidePayouts)],
      ['Pending Escrow', String(data.pendingEscrow.amount)],
      ['Pending Payouts', String(data.pendingPayouts)],
      ['Completed Payouts', String(data.completedPayouts.amount)],
      ['Failed Payouts', String(data.failedPayouts)],
      ['Agency Subscription Revenue', String(data.agencySubscriptionRevenue)],
      ['Refund Totals', String(data.refundTotals)],
      ['Outstanding Reconciliation Issues', String(data.outstandingReconciliationIssues)],
      ['Webhook Failures', String(data.webhookFailures)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    return { csv, filename: `financial-health-${Date.now()}.csv`, exportedBy: adminId };
  }

  private async getDailyRevenue(from: Date, to: Date) {
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; total: number }>>`
      SELECT DATE_TRUNC('day', "createdAt") as day, SUM("amount") as total
      FROM "financial_ledger"
      WHERE "ledgerType" = 'COMMISSION'
        AND "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;
    return rows.map((r) => ({
      date: r.day,
      revenue: Number(r.total),
    }));
  }

  private async getMonthlyRevenue(from: Date, to: Date) {
    const rows = await this.prisma.$queryRaw<Array<{ month: Date; total: number }>>`
      SELECT DATE_TRUNC('month', "createdAt") as month, SUM("amount") as total
      FROM "financial_ledger"
      WHERE "ledgerType" = 'COMMISSION'
        AND "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
    return rows.map((r) => ({
      month: r.month,
      revenue: Number(r.total),
    }));
  }

  private async persistAccountingSnapshot(
    periodStart: Date,
    periodEnd: Date,
    accounting: {
      gmv: number;
      platformRevenue: number;
      guideEarnings: number;
      agencySubscriptionRevenue: number;
      refundTotals: number;
      commissionRevenue: number;
      currency: string;
      vatAmount: number | null;
      taxAmount: number | null;
    },
  ) {
    const existing = await this.prisma.financial_accounting_snapshots.findFirst({
      where: { periodStart, periodEnd },
    });
    if (existing) return existing;

    return this.prisma.financial_accounting_snapshots.create({
      data: {
        id: randomUUID(),
        periodStart,
        periodEnd,
        gmv: accounting.gmv,
        platformRevenue: accounting.platformRevenue,
        guideEarnings: accounting.guideEarnings,
        agencySubscriptionRevenue: accounting.agencySubscriptionRevenue,
        refundTotals: accounting.refundTotals,
        commissionRevenue: accounting.commissionRevenue,
        vatAmount: accounting.vatAmount,
        taxAmount: accounting.taxAmount,
        currency: accounting.currency,
      },
    });
  }
}
