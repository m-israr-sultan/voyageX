import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  LedgerEntryStatus,
  LedgerType,
  PayoutAccountStatus,
  PayoutStatus,
  Prisma,
  ReleaseSource,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PLATFORM_CONFIG } from '../../../common/config/platform.config';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayoutGatewayFactory } from '../providers/payout-gateway.factory';
import { FinancialReferenceService } from './financial-reference.service';
import { FinancialValidationService } from './financial-validation.service';
import { NotificationService } from '../../services/notification.service';
import { FinancialCompletionService } from './financial-completion.service';

export type EscrowReleasePayoutInput = {
  bookingId: string;
  paymentId: string;
  guideId: string;
  guideUserId: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  releaseSource: ReleaseSource;
  actorId: string;
};

@Injectable()
export class PayoutOrchestrationService {
  private readonly logger = new Logger(PayoutOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly references: FinancialReferenceService,
    private readonly validation: FinancialValidationService,
    private readonly payoutGateways: PayoutGatewayFactory,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async processEscrowReleasePayout(input: EscrowReleasePayoutInput): Promise<void> {
    const existing = await this.prisma.guide_payouts.findUnique({
      where: {
        bookingId_paymentId: {
          bookingId: input.bookingId,
          paymentId: input.paymentId,
        },
      },
    });

    if (existing) {
      if (existing.status === PayoutStatus.SUCCESS) {
        this.logger.log(
          `Payout already completed for booking=${input.bookingId} — skipping`,
        );
        return;
      }
      if (
        existing.status === PayoutStatus.PENDING ||
        existing.status === PayoutStatus.PROCESSING
      ) {
        this.logger.log(
          `Payout already in progress for booking=${input.bookingId} — skipping`,
        );
        return;
      }
      if (existing.status === PayoutStatus.FAILED) {
        await this.retryPayout(existing.id);
        return;
      }
    }

    const payoutAccount = await this.prisma.guide_payout_accounts.findFirst({
      where: {
        guideId: input.guideId,
        isDefault: true,
        accountStatus: PayoutAccountStatus.ACTIVE,
        verified: true,
      },
    });

    if (!payoutAccount) {
      this.logger.warn(
        `No active default payout account for guide=${input.guideId}. Payout deferred.`,
      );
      return;
    }

    const voyagexReference = this.references.generatePayoutReference();
    await this.validation.assertUniquePayoutReference(voyagexReference);

    const now = new Date();
    const payout = await this.prisma.guide_payouts.create({
      data: {
        id: randomUUID(),
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        guideId: input.guideId,
        provider: payoutAccount.provider,
        grossAmount: input.grossAmount,
        commissionAmount: input.commissionAmount,
        netAmount: input.netAmount,
        currency: PLATFORM_CONFIG.currency,
        status: PayoutStatus.PENDING,
        voyagexReference,
        requestedAt: now,
        updatedAt: now,
      },
    });

    this.audit.log({
      action: 'financial.payout.requested',
      actorId: input.actorId,
      resourceType: 'guide_payout',
      resourceId: payout.id,
      metadata: {
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        voyagexReference,
        netAmount: input.netAmount,
      },
    });

    await this.notifications.notifyPayoutInitiated(
      input.guideUserId,
      input.netAmount,
      input.bookingId,
    );

    await this.executePayout(payout.id, payoutAccount, input.guideUserId);
  }

  async executePayout(
    payoutId: string,
    payoutAccount?: {
      provider: import('@prisma/client').PayoutProvider;
      accountTitle: string;
      mobileNumber: string | null;
      iban: string | null;
      bankName: string | null;
    },
    guideUserId?: string,
  ): Promise<void> {
    const payout = await this.prisma.guide_payouts.findUnique({
      where: { id: payoutId },
      include: {
        guides: { include: { users: true } },
        bookings: true,
        payments: true,
      },
    });
    if (!payout) return;

    if (payout.status === PayoutStatus.SUCCESS) return;

    const account =
      payoutAccount ??
      (await this.prisma.guide_payout_accounts.findFirst({
        where: {
          guideId: payout.guideId,
          provider: payout.provider,
          accountStatus: PayoutAccountStatus.ACTIVE,
          verified: true,
          isDefault: true,
        },
      }));

    if (!account) {
      await this.markPayoutFailed(payout.id, 'No active payout account available', guideUserId);
      return;
    }

    const guideUser = guideUserId ?? payout.guides.userId;

    await this.prisma.guide_payouts.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.PROCESSING, updatedAt: new Date() },
    });

    this.audit.log({
      action: 'financial.payout.processing',
      actorId: 'SYSTEM',
      resourceType: 'guide_payout',
      resourceId: payoutId,
      metadata: { voyagexReference: payout.voyagexReference },
    });

    await this.notifications.notifyPayoutProcessing(
      guideUser,
      payout.netAmount,
      payout.bookingId,
    );

    const gateway = this.payoutGateways.getGateway(payout.provider);

    try {
      const result = await gateway.initiatePayout({
        payoutId: payout.id,
        guideId: payout.guideId,
        provider: payout.provider,
        amount: payout.netAmount,
        currency: payout.currency,
        voyagexReference: payout.voyagexReference,
        accountTitle: account.accountTitle,
        mobileNumber: account.mobileNumber ?? undefined,
        iban: account.iban ?? undefined,
        bankName: account.bankName ?? undefined,
      });

      if (!result.success) {
        await this.markPayoutFailed(
          payoutId,
          result.message || 'Provider rejected payout',
          guideUser,
          result.providerReference,
        );
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.guide_payouts.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.SUCCESS,
            providerReference: result.providerReference,
            completedAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              providerMessage: result.message,
            } as Prisma.InputJsonValue,
          },
        });

        await tx.payments.update({
          where: { id: payout.paymentId },
          data: {
            platformFee: payout.commissionAmount,
            netAmount: payout.netAmount,
            updatedAt: new Date(),
          },
        });

        await this.createLedgerEntries(tx, payout, 'SYSTEM');
      });

      await this.notifications.notifyPayoutCompleted(
        guideUser,
        payout.netAmount,
        payout.bookingId,
      );

      this.audit.log({
        action: 'financial.payout.completed',
        actorId: 'SYSTEM',
        resourceType: 'guide_payout',
        resourceId: payoutId,
        metadata: {
          providerReference: result.providerReference,
          netAmount: payout.netAmount,
        },
      });

      const completion = this.moduleRef.get(FinancialCompletionService, { strict: false });
      completion.completeGuidePayout(payoutId).catch((err) =>
        this.logger.warn(`Payout receipt failed: ${err instanceof Error ? err.message : 'unknown'}`),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gateway unavailable';
      this.logger.error(`Payout execution failed id=${payoutId}: ${message}`);
      await this.markPayoutFailed(payoutId, message, guideUser);
    }
  }

  async retryPayout(payoutId: string): Promise<void> {
    const payout = await this.prisma.guide_payouts.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== PayoutStatus.FAILED) return;
    if (payout.retryCount >= PLATFORM_CONFIG.payoutMaxRetries) {
      this.logger.warn(`Payout ${payoutId} exceeded max retries`);
      return;
    }

    await this.prisma.guide_payouts.update({
      where: { id: payoutId },
      data: {
        retryCount: payout.retryCount + 1,
        status: PayoutStatus.PENDING,
        failureReason: null,
        failedAt: null,
        updatedAt: new Date(),
      },
    });

    this.audit.log({
      action: 'financial.payout.retry',
      actorId: 'SYSTEM',
      resourceType: 'guide_payout',
      resourceId: payoutId,
      metadata: { retryCount: payout.retryCount + 1 },
    });

    const guide = await this.prisma.guides.findUnique({ where: { id: payout.guideId } });
    if (guide) {
      await this.executePayout(payoutId, undefined, guide.userId);
    }
  }

  private async markPayoutFailed(
    payoutId: string,
    reason: string,
    guideUserId?: string,
    providerReference?: string,
  ): Promise<void> {
    const payout = await this.prisma.guide_payouts.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.FAILED,
        failureReason: reason,
        failedAt: new Date(),
        providerReference: providerReference ?? undefined,
        updatedAt: new Date(),
      },
      include: { guides: true },
    });

    this.audit.log({
      action: 'financial.payout.failed',
      actorId: 'SYSTEM',
      resourceType: 'guide_payout',
      resourceId: payoutId,
      metadata: { reason, providerReference },
    });

    if (guideUserId ?? payout.guides.userId) {
      await this.notifications.notifyPayoutFailed(
        guideUserId ?? payout.guides.userId,
        payout.netAmount,
        payout.bookingId,
        reason,
      );
    }
  }

  private async createLedgerEntries(
    tx: Prisma.TransactionClient,
    payout: {
      id: string;
      bookingId: string;
      paymentId: string;
      grossAmount: number;
      commissionAmount: number;
      netAmount: number;
      currency: string;
      guideId: string;
    },
    createdBy: string,
  ): Promise<void> {
    const entries: Array<{
      ledgerType: LedgerType;
      amount: number;
      remarks: string;
    }> = [
      {
        ledgerType: LedgerType.ESCROW_RELEASE,
        amount: payout.grossAmount,
        remarks: 'Escrow released after trip completion',
      },
    ];

    if (payout.commissionAmount > 0) {
      entries.push({
        ledgerType: LedgerType.COMMISSION,
        amount: payout.commissionAmount,
        remarks: 'Platform commission deducted',
      });
    }

    entries.push({
      ledgerType: LedgerType.GUIDE_PAYOUT,
      amount: payout.netAmount,
      remarks: 'Guide payout disbursed',
    });

    for (const entry of entries) {
      const referenceNumber = this.references.generateLedgerReference();
      const idempotencyKey = `payout:${payout.id}:${entry.ledgerType}`;
      const existing = await tx.financial_ledger.findUnique({
        where: { idempotencyKey },
      });
      if (existing) continue;

      await tx.financial_ledger.create({
        data: {
          id: randomUUID(),
          ledgerType: entry.ledgerType,
          bookingId: payout.bookingId,
          paymentId: payout.paymentId,
          payoutId: payout.id,
          userId: payout.guideId,
          amount: entry.amount,
          currency: payout.currency,
          status: LedgerEntryStatus.POSTED,
          remarks: entry.remarks,
          referenceNumber,
          idempotencyKey,
          createdBy,
        },
      });

      this.audit.log({
        action: 'financial.ledger.created',
        actorId: createdBy,
        resourceType: 'financial_ledger',
        resourceId: referenceNumber,
        metadata: {
          ledgerType: entry.ledgerType,
          amount: entry.amount,
          payoutId: payout.id,
        },
      });
    }
  }

  async getGuideWallet(
    userId: string,
    query: { status?: string; search?: string; page?: number; limit?: number },
  ) {
    const guide = await this.prisma.guides.findUnique({ where: { userId } });
    if (!guide) throw new NotFoundException('Guide profile not found');

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.guide_payoutsWhereInput = { guideId: guide.id };
    if (query.status) {
      where.status = query.status as PayoutStatus;
    }
    if (query.search) {
      where.OR = [
        { voyagexReference: { contains: query.search, mode: 'insensitive' } },
        { providerReference: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [payouts, total, aggregates] = await Promise.all([
      this.prisma.guide_payouts.findMany({
        where,
        include: {
          bookings: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              packages: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.guide_payouts.count({ where }),
      this.prisma.guide_payouts.groupBy({
        by: ['status'],
        where: { guideId: guide.id },
        _sum: { netAmount: true, commissionAmount: true, grossAmount: true },
        _count: true,
      }),
    ]);

    const lifetimeEarnings = aggregates
      .filter((a) => a.status === PayoutStatus.SUCCESS)
      .reduce((sum, a) => sum + (a._sum.netAmount ?? 0), 0);

    const pendingStatuses: PayoutStatus[] = [PayoutStatus.PENDING, PayoutStatus.PROCESSING];
    const pendingBalance = aggregates
      .filter((a) => pendingStatuses.includes(a.status))
      .reduce((sum, a) => sum + (a._sum.netAmount ?? 0), 0);

    const totalCommission = aggregates
      .filter((a) => a.status === PayoutStatus.SUCCESS)
      .reduce((sum, a) => sum + (a._sum.commissionAmount ?? 0), 0);

    return {
      summary: {
        lifetimeEarnings,
        pendingBalance,
        totalCommission,
        currency: PLATFORM_CONFIG.currency,
      },
      payouts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listPayoutsForAdmin(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.guide_payoutsWhereInput = {};
    if (query.status) where.status = query.status as PayoutStatus;
    if (query.search) {
      where.OR = [
        { voyagexReference: { contains: query.search, mode: 'insensitive' } },
        { providerReference: { contains: query.search, mode: 'insensitive' } },
        { guides: { users: { email: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [payouts, total, retryQueue] = await Promise.all([
      this.prisma.guide_payouts.findMany({
        where,
        include: {
          guides: {
            include: {
              users: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          bookings: { select: { id: true, startDate: true, endDate: true, totalPrice: true } },
          payments: { select: { id: true, transactionId: true, providerTransactionId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.guide_payouts.count({ where }),
      this.prisma.guide_payouts.findMany({
        where: {
          status: PayoutStatus.FAILED,
          retryCount: { lt: PLATFORM_CONFIG.payoutMaxRetries },
        },
        orderBy: { failedAt: 'asc' },
        take: 50,
      }),
    ]);

    return {
      payouts,
      retryQueue,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
