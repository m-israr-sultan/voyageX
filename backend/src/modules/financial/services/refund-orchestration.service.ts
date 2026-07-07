import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PaymentStatus, Prisma, RefundStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentProviderFactory } from '../../payments/providers/payment-provider.factory';
import { FinancialCompletionService } from './financial-completion.service';
import { FinancialSettingsService } from './financial-settings.service';

@Injectable()
export class RefundOrchestrationService {
  private readonly logger = new Logger(RefundOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: FinancialSettingsService,
    private readonly moduleRef: ModuleRef,
    private readonly completion: FinancialCompletionService,
    private readonly audit: AuditService,
  ) {}

  async requestTravelerRefund(
    userId: string,
    paymentId: string,
    amount: number,
    reason: string,
  ) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new BadRequestException('Not your payment');

    const idempotencyKey = `refund-request:${paymentId}:${userId}:${amount}`;
    const existing = await this.prisma.refunds.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    const totalRefunded = payment.refunds
      .filter((r) => r.status !== RefundStatus.FAILED && r.status !== RefundStatus.REJECTED)
      .reduce((sum, r) => sum + r.amount, 0);
    if (totalRefunded + amount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment total');
    }

    const now = new Date();
    const refund = await this.prisma.refunds.create({
      data: {
        id: randomUUID(),
        bookingId: payment.bookingId,
        paymentId,
        amount,
        currency: payment.currency,
        reason,
        status: RefundStatus.REQUESTED,
        initiatedById: userId,
        requestedById: userId,
        idempotencyKey,
        updatedAt: now,
      },
    });

    this.audit.log({
      action: 'financial.refund.requested',
      actorId: userId,
      resourceType: 'refund',
      resourceId: refund.id,
      metadata: { paymentId, amount },
    });

    return refund;
  }

  async approveRefund(adminId: string, refundId: string) {
    const refund = await this.prisma.refunds.findUnique({ where: { id: refundId } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== RefundStatus.REQUESTED) {
      throw new BadRequestException(`Refund is ${refund.status}, cannot approve`);
    }

    await this.prisma.refunds.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.APPROVED,
        approvedById: adminId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.audit.log({
      action: 'financial.refund.approved',
      actorId: adminId,
      resourceType: 'refund',
      resourceId: refundId,
    });

    return this.processRefund(refundId);
  }

  async rejectRefund(adminId: string, refundId: string, reason: string) {
    const refund = await this.prisma.refunds.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.REJECTED,
        rejectedReason: reason,
        updatedAt: new Date(),
      },
    });
    this.audit.log({
      action: 'financial.refund.rejected',
      actorId: adminId,
      resourceType: 'refund',
      resourceId: refundId,
      metadata: { reason },
    });
    return refund;
  }

  async initiateAdminRefund(adminId: string, paymentId: string, amount: number, reason: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const idempotencyKey = `refund-admin:${paymentId}:${amount}`;
    const existing = await this.prisma.refunds.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.status === RefundStatus.PROCESSED) return existing;
      return this.processRefund(existing.id);
    }

    const totalRefunded = payment.refunds
      .filter(
        (r) =>
          r.status === RefundStatus.PROCESSED ||
          r.status === RefundStatus.PENDING ||
          r.status === RefundStatus.APPROVED,
      )
      .reduce((sum, r) => sum + r.amount, 0);
    if (totalRefunded + amount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment total');
    }

    const now = new Date();
    const refund = await this.prisma.refunds.create({
      data: {
        id: randomUUID(),
        bookingId: payment.bookingId,
        paymentId,
        amount,
        currency: payment.currency,
        reason,
        status: RefundStatus.PENDING,
        initiatedById: adminId,
        approvedById: adminId,
        approvedAt: now,
        idempotencyKey,
        updatedAt: now,
      },
    });

    this.audit.log({
      action: 'financial.refund.initiated',
      actorId: adminId,
      resourceType: 'refund',
      resourceId: refund.id,
      metadata: { paymentId, amount },
    });

    return this.processRefund(refund.id);
  }

  async processRefund(refundId: string) {
    const refund = await this.prisma.refunds.findUnique({
      where: { id: refundId },
      include: { payments: true },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status === RefundStatus.PROCESSED) return refund;

    const payment = refund.payments;
    const factory = this.moduleRef.get(PaymentProviderFactory, { strict: false });
    const provider = factory.getProvider(payment.method);
    let providerRefundId = `sandbox_refund_${refund.id}`;

    if (!this.settings.getSandboxMode() && payment.providerTransactionId) {
      const result = await provider.initiateRefund({
        providerTransactionId: payment.providerTransactionId,
        amount: refund.amount,
        reason: refund.reason,
      });
      providerRefundId = result.refundReference;
    }

    const now = new Date();
    const totalRefunded = await this.getTotalRefundedForPayment(payment.id, refundId);
    const isFullRefund = totalRefunded + refund.amount >= payment.amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.refunds.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.PROCESSED,
          providerRefundId,
          processedAt: now,
          updatedAt: now,
        },
      });

      if (isFullRefund) {
        await tx.payments.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED, refundedAt: now, updatedAt: now },
        });
      }
    });

    await this.completion.completeRefund(refundId);

    this.audit.log({
      action: 'financial.refund.processed',
      actorId: 'SYSTEM',
      resourceType: 'refund',
      resourceId: refundId,
      metadata: { providerRefundId, amount: refund.amount },
    });

    return this.prisma.refunds.findUnique({ where: { id: refundId } });
  }

  async handleRefundWebhook(providerRefundId: string, status: string) {
    const refund = await this.prisma.refunds.findFirst({
      where: { providerRefundId },
    });
    if (!refund) return null;

    if (status === 'SUCCESS' && refund.status !== RefundStatus.PROCESSED) {
      return this.processRefund(refund.id);
    }
    if (status === 'FAILED' && refund.status !== RefundStatus.FAILED) {
      await this.prisma.refunds.update({
        where: { id: refund.id },
        data: { status: RefundStatus.FAILED, updatedAt: new Date() },
      });
      this.audit.log({
        action: 'financial.refund.failed',
        actorId: 'SYSTEM',
        resourceType: 'refund',
        resourceId: refund.id,
        metadata: { providerRefundId },
      });
    }
    return refund;
  }

  private async getTotalRefundedForPayment(paymentId: string, excludeId: string) {
    const refunds = await this.prisma.refunds.findMany({
      where: {
        paymentId,
        status: RefundStatus.PROCESSED,
        id: { not: excludeId },
      },
    });
    return refunds.reduce((sum, r) => sum + r.amount, 0);
  }

  async listRefunds(query: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 25, 100);
    const where: Prisma.refundsWhereInput = {};
    if (query.status) where.status = query.status as RefundStatus;

    const [items, total] = await Promise.all([
      this.prisma.refunds.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payments: { select: { id: true, amount: true, transactionId: true, method: true } },
          bookings: { select: { id: true, totalPrice: true } },
        },
      }),
      this.prisma.refunds.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
