import { Injectable, Logger } from '@nestjs/common';
import {
  LedgerType,
  PaymentStatus,
  PayoutStatus,
  Prisma,
  ReconciliationIssueSeverity,
  ReconciliationIssueType,
  ReconciliationPeriod,
  ReconciliationReportStatus,
  ReceiptType,
  RefundStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';

type IssueInput = {
  issueType: ReconciliationIssueType;
  severity: ReconciliationIssueSeverity;
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async runReport(
    period: ReconciliationPeriod,
    periodStart: Date,
    periodEnd: Date,
    triggeredBy: string,
  ) {
    const report = await this.prisma.reconciliation_reports.create({
      data: {
        id: randomUUID(),
        period,
        periodStart,
        periodEnd,
        status: ReconciliationReportStatus.RUNNING,
        triggeredBy,
      },
    });

    this.audit.log({
      action: 'financial.reconciliation.started',
      actorId: triggeredBy,
      resourceType: 'reconciliation_report',
      resourceId: report.id,
      metadata: { period, periodStart, periodEnd },
    });

    try {
      const issues = await this.detectIssues(periodStart, periodEnd);
      if (issues.length > 0) {
        await this.prisma.reconciliation_issues.createMany({
          data: issues.map((issue) => ({
            id: randomUUID(),
            reportId: report.id,
            ...issue,
            metadata: issue.metadata as Prisma.InputJsonValue,
          })),
        });
      }

      const summary = {
        paymentsChecked: await this.prisma.payments.count({
          where: { createdAt: { gte: periodStart, lte: periodEnd } },
        }),
        payoutsChecked: await this.prisma.guide_payouts.count({
          where: { createdAt: { gte: periodStart, lte: periodEnd } },
        }),
        issuesFound: issues.length,
      };

      const completed = await this.prisma.reconciliation_reports.update({
        where: { id: report.id },
        data: {
          status: ReconciliationReportStatus.COMPLETED,
          issueCount: issues.length,
          summary: summary as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
        include: { issues: true },
      });

      this.audit.log({
        action: 'financial.reconciliation.completed',
        actorId: triggeredBy,
        resourceType: 'reconciliation_report',
        resourceId: report.id,
        metadata: { issueCount: issues.length },
      });

      return completed;
    } catch (error: unknown) {
      await this.prisma.reconciliation_reports.update({
        where: { id: report.id },
        data: { status: ReconciliationReportStatus.FAILED, completedAt: new Date() },
      });
      this.audit.log({
        action: 'financial.reconciliation.failed',
        actorId: triggeredBy,
        resourceType: 'reconciliation_report',
        resourceId: report.id,
        metadata: { error: error instanceof Error ? error.message : 'unknown' },
      });
      throw error;
    }
  }

  async runDaily(): Promise<void> {
    const end = new Date();
    const start = new Date(end.getTime() - 86_400_000);
    await this.runReport(ReconciliationPeriod.DAILY, start, end, 'SYSTEM');
  }

  async runWeekly(): Promise<void> {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 86_400_000);
    await this.runReport(ReconciliationPeriod.WEEKLY, start, end, 'SYSTEM');
  }

  async runMonthly(): Promise<void> {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86_400_000);
    await this.runReport(ReconciliationPeriod.MONTHLY, start, end, 'SYSTEM');
  }

  private async detectIssues(periodStart: Date, periodEnd: Date): Promise<IssueInput[]> {
    const issues: IssueInput[] = [];

    const payments = await this.prisma.payments.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
        status: {
          in: [PaymentStatus.HELD, PaymentStatus.RELEASED, PaymentStatus.CONFIRMED],
        },
      },
      include: { ledgerEntries: true, receipts: true },
    });

    for (const payment of payments) {
      const hasTravelerLedger = payment.ledgerEntries.some(
        (e) => e.ledgerType === LedgerType.TRAVELER_PAYMENT,
      );
      if (!hasTravelerLedger) {
        issues.push({
          issueType: ReconciliationIssueType.PAYMENT_WITHOUT_LEDGER,
          severity: ReconciliationIssueSeverity.HIGH,
          resourceType: 'payment',
          resourceId: payment.id,
          description: `Payment ${payment.id} has no TRAVELER_PAYMENT ledger entry`,
        });
      }
      const hasReceipt = payment.receipts.some((r) => r.receiptType === ReceiptType.PAYMENT);
      if (!hasReceipt) {
        issues.push({
          issueType: ReconciliationIssueType.PROVIDER_SUCCESS_NO_RECEIPT,
          severity: ReconciliationIssueSeverity.MEDIUM,
          resourceType: 'payment',
          resourceId: payment.id,
          description: `Payment ${payment.id} has no PAYMENT receipt`,
        });
      }
    }

    const ledgerEntries = await this.prisma.financial_ledger.findMany({
      where: { createdAt: { gte: periodStart, lte: periodEnd } },
      include: { payments: { include: { receipts: true } } },
    });

    for (const entry of ledgerEntries) {
      if (entry.paymentId && entry.payments && entry.ledgerType !== LedgerType.COMMISSION) {
        if (entry.payments.receipts.length === 0) {
          issues.push({
            issueType: ReconciliationIssueType.LEDGER_WITHOUT_RECEIPT,
            severity: ReconciliationIssueSeverity.MEDIUM,
            resourceType: 'financial_ledger',
            resourceId: entry.id,
            description: `Ledger ${entry.referenceNumber} has no linked receipt`,
          });
        }
      }
    }

    const duplicateLedger = await this.prisma.$queryRaw<
      Array<{ idempotencyKey: string; count: bigint }>
    >`
      SELECT "idempotencyKey", COUNT(*) as count
      FROM "financial_ledger"
      WHERE "idempotencyKey" IS NOT NULL
        AND "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
      GROUP BY "idempotencyKey"
      HAVING COUNT(*) > 1
    `;
    for (const dup of duplicateLedger) {
      issues.push({
        issueType: ReconciliationIssueType.DUPLICATE_LEDGER,
        severity: ReconciliationIssueSeverity.CRITICAL,
        resourceType: 'financial_ledger',
        resourceId: dup.idempotencyKey,
        description: `Duplicate ledger idempotency key: ${dup.idempotencyKey}`,
      });
    }

    const duplicateReceipts = await this.prisma.$queryRaw<
      Array<{ receiptNumber: string; count: bigint }>
    >`
      SELECT "receiptNumber", COUNT(*) as count
      FROM "receipts"
      WHERE "createdAt" >= ${periodStart} AND "createdAt" <= ${periodEnd}
      GROUP BY "receiptNumber"
      HAVING COUNT(*) > 1
    `;
    for (const dup of duplicateReceipts) {
      issues.push({
        issueType: ReconciliationIssueType.DUPLICATE_RECEIPT,
        severity: ReconciliationIssueSeverity.CRITICAL,
        resourceType: 'receipt',
        resourceId: dup.receiptNumber,
        description: `Duplicate receipt number: ${dup.receiptNumber}`,
      });
    }

    const payouts = await this.prisma.guide_payouts.findMany({
      where: { createdAt: { gte: periodStart, lte: periodEnd } },
    });
    const payoutKeys = new Map<string, number>();
    for (const p of payouts) {
      const key = `${p.bookingId}:${p.paymentId}`;
      payoutKeys.set(key, (payoutKeys.get(key) ?? 0) + 1);
    }
    for (const [key, count] of payoutKeys) {
      if (count > 1) {
        issues.push({
          issueType: ReconciliationIssueType.DUPLICATE_PAYOUT,
          severity: ReconciliationIssueSeverity.CRITICAL,
          resourceType: 'guide_payout',
          resourceId: key,
          description: `Duplicate payout for booking/payment: ${key}`,
        });
      }
    }

    for (const payout of payouts) {
      if (payout.status === PayoutStatus.SUCCESS && !payout.providerReference) {
        issues.push({
          issueType: ReconciliationIssueType.PAYOUT_PROVIDER_MISMATCH,
          severity: ReconciliationIssueSeverity.HIGH,
          resourceType: 'guide_payout',
          resourceId: payout.id,
          description: `Payout ${payout.id} marked SUCCESS without provider reference`,
        });
      }
      if (payout.status === PayoutStatus.FAILED && payout.providerReference) {
        issues.push({
          issueType: ReconciliationIssueType.PAYOUT_PROVIDER_MISMATCH,
          severity: ReconciliationIssueSeverity.MEDIUM,
          resourceType: 'guide_payout',
          resourceId: payout.id,
          description: `Payout ${payout.id} FAILED but has provider reference`,
        });
      }
    }

    const unprocessedWebhooks = await this.prisma.webhook_events.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
        processedAt: null,
      },
      take: 100,
    });
    for (const wh of unprocessedWebhooks) {
      issues.push({
        issueType: ReconciliationIssueType.WEBHOOK_UNPROCESSED,
        severity: ReconciliationIssueSeverity.HIGH,
        resourceType: 'webhook_event',
        resourceId: wh.id,
        description: `Webhook ${wh.id} (${wh.provider}) not processed`,
      });
    }

    const refunds = await this.prisma.refunds.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
        status: RefundStatus.PROCESSED,
      },
    });
    for (const refund of refunds) {
      const ledger = await this.prisma.financial_ledger.findFirst({
        where: {
          paymentId: refund.paymentId,
          ledgerType: LedgerType.REFUND,
          idempotencyKey: `refund:${refund.id}`,
        },
      });
      if (!ledger) {
        issues.push({
          issueType: ReconciliationIssueType.REFUND_WITHOUT_LEDGER,
          severity: ReconciliationIssueSeverity.HIGH,
          resourceType: 'refund',
          resourceId: refund.id,
          description: `Processed refund ${refund.id} has no ledger entry`,
        });
      }
    }

    const unmatchedLines = await this.prisma.provider_statement_lines.findMany({
      where: {
        matchStatus: 'UNMATCHED',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      take: 50,
    });
    for (const line of unmatchedLines) {
      issues.push({
        issueType: ReconciliationIssueType.STATEMENT_MISMATCH,
        severity: ReconciliationIssueSeverity.MEDIUM,
        resourceType: 'provider_statement_line',
        resourceId: line.id,
        description: `Provider statement line ${line.providerReference} unmatched`,
      });
    }

    return issues;
  }

  async listReports(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.reconciliation_reports.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { issues: { where: { resolved: false }, take: 5 } },
      }),
      this.prisma.reconciliation_reports.count(),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getReport(id: string) {
    return this.prisma.reconciliation_reports.findUniqueOrThrow({
      where: { id },
      include: { issues: { orderBy: { severity: 'desc' } } },
    });
  }

  async resolveIssue(issueId: string, adminId: string) {
    const issue = await this.prisma.reconciliation_issues.update({
      where: { id: issueId },
      data: { resolved: true, resolvedAt: new Date(), resolvedBy: adminId },
    });
    this.audit.log({
      action: 'financial.reconciliation.issue_resolved',
      actorId: adminId,
      resourceType: 'reconciliation_issue',
      resourceId: issueId,
    });
    return issue;
  }

  async getOpenIssueCount(): Promise<number> {
    return this.prisma.reconciliation_issues.count({ where: { resolved: false } });
  }
}
