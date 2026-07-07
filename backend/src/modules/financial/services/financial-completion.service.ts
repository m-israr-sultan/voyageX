import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  LedgerType,
  PaymentStatus,
  ReceiptStatus,
  ReceiptType,
} from '@prisma/client';
import { effectiveGuideCommissionRate } from '../../../common/config/platform.config';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../services/email.service';
import { FINANCIAL_EMAIL_SUBJECTS } from '../financial-email.constants';
import { LedgerService } from './ledger.service';
import { ReceiptService } from './receipt.service';
import type { ReceiptMetadata } from '../types/receipt-metadata.interface';

@Injectable()
export class FinancialCompletionService {
  private readonly logger = new Logger(FinancialCompletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly receipts: ReceiptService,
    private readonly moduleRef: ModuleRef,
    private readonly audit: AuditService,
  ) {}

  async completeTravelerPayment(paymentId: string): Promise<void> {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        bookings: {
          include: {
            packages: { include: { guides: { include: { users: true } } } },
            users: true,
          },
        },
        users: true,
      },
    });
    if (!payment || payment.status === PaymentStatus.FAILED) return;

    const travelerName = payment.users
      ? `${payment.users.firstName} ${payment.users.lastName}`.trim()
      : undefined;
    const guideName = payment.bookings?.packages?.guides?.users
      ? `${payment.bookings.packages.guides.users.firstName} ${payment.bookings.packages.guides.users.lastName}`.trim()
      : undefined;

    await this.ledger.postEntry({
      ledgerType: LedgerType.TRAVELER_PAYMENT,
      amount: payment.amount,
      currency: payment.currency,
      bookingId: payment.bookingId,
      paymentId: payment.id,
      userId: payment.userId,
      remarks: 'Traveler payment received',
      idempotencyKey: `payment:${payment.id}:traveler_payment`,
    });

    await this.ledger.postEntry({
      ledgerType: LedgerType.ESCROW_HOLD,
      amount: payment.amount,
      currency: payment.currency,
      bookingId: payment.bookingId,
      paymentId: payment.id,
      userId: payment.userId,
      remarks: 'Funds held in escrow',
      idempotencyKey: `payment:${payment.id}:escrow_hold`,
    });

    const commissionRate = effectiveGuideCommissionRate();
    const commission = Math.round(payment.amount * commissionRate / 100);
    const net = payment.amount - commission;

    const voyagexRef = payment.transactionId ?? `PAY-${payment.id.slice(0, 8)}`;

    const metadata: ReceiptMetadata = {
      status: 'CONFIRMED',
      currency: payment.currency,
      paymentMethod: payment.method,
      providerReference: payment.providerTransactionId ?? undefined,
      voyagexReference: voyagexRef,
      transactionId: payment.transactionId ?? undefined,
      bookingId: payment.bookingId,
      grossAmount: payment.amount,
      commissionAmount: commission,
      netAmount: net,
      travelerName,
      guideName,
      timestamp: new Date().toISOString(),
    };

    const receipt = await this.receipts.generateReceipt({
      receiptType: ReceiptType.PAYMENT,
      voyagexReference: voyagexRef,
      metadata,
      bookingId: payment.bookingId,
      paymentId: payment.id,
      providerReference: payment.providerTransactionId ?? undefined,
    });

    await this.emailReceipt(
      payment.users?.email,
      FINANCIAL_EMAIL_SUBJECTS.PAYMENT_SUCCESS,
      receipt.id,
      receipt.receiptNumber,
    );
  }

  async completeEscrowRelease(bookingId: string, paymentId: string): Promise<void> {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        bookings: {
          include: {
            packages: { include: { guides: { include: { users: true } } } },
            users: true,
          },
        },
        users: true,
      },
    });
    if (!payment) return;

    const commission = payment.platformFee ?? Math.round(
      payment.amount * effectiveGuideCommissionRate() / 100,
    );
    const net = payment.netAmount ?? payment.amount - commission;

    await this.ledger.postEntry({
      ledgerType: LedgerType.ESCROW_RELEASE,
      amount: payment.amount,
      currency: payment.currency,
      bookingId,
      paymentId,
      userId: payment.userId,
      remarks: 'Escrow released after tour completion',
      idempotencyKey: `payment:${paymentId}:escrow_release`,
    });

    const voyagexRef = payment.transactionId ?? `PAY-${payment.id.slice(0, 8)}`;

    const metadata: ReceiptMetadata = {
      status: 'RELEASED',
      currency: payment.currency,
      paymentMethod: payment.method,
      voyagexReference: voyagexRef,
      transactionId: payment.transactionId ?? undefined,
      bookingId,
      grossAmount: payment.amount,
      commissionAmount: commission,
      netAmount: net,
      travelerName: payment.users
        ? `${payment.users.firstName} ${payment.users.lastName}`.trim()
        : undefined,
      guideName: payment.bookings?.packages?.guides?.users
        ? `${payment.bookings.packages.guides.users.firstName} ${payment.bookings.packages.guides.users.lastName}`.trim()
        : undefined,
      timestamp: new Date().toISOString(),
    };

    const receipt = await this.receipts.generateReceipt({
      receiptType: ReceiptType.ESCROW,
      voyagexReference: `${voyagexRef}-ESCROW`,
      metadata,
      bookingId,
      paymentId,
    });

    await this.emailReceipt(
      payment.users?.email,
      FINANCIAL_EMAIL_SUBJECTS.ESCROW_RELEASED,
      receipt.id,
      receipt.receiptNumber,
    );
  }

  async completeGuidePayout(payoutId: string): Promise<void> {
    const payout = await this.prisma.guide_payouts.findUnique({
      where: { id: payoutId },
      include: {
        guides: { include: { users: true } },
        bookings: { include: { users: true, packages: true } },
        payments: true,
      },
    });
    if (!payout) return;

    const metadata: ReceiptMetadata = {
      status: 'SUCCESS',
      currency: payout.currency,
      provider: payout.provider,
      providerReference: payout.providerReference ?? undefined,
      voyagexReference: payout.voyagexReference,
      bookingId: payout.bookingId,
      transactionId: payout.payments?.transactionId ?? undefined,
      grossAmount: payout.grossAmount,
      commissionAmount: payout.commissionAmount,
      netAmount: payout.netAmount,
      guideName: payout.guides.users
        ? `${payout.guides.users.firstName} ${payout.guides.users.lastName}`.trim()
        : undefined,
      travelerName: payout.bookings?.users
        ? `${payout.bookings.users.firstName} ${payout.bookings.users.lastName}`.trim()
        : undefined,
      timestamp: (payout.completedAt ?? new Date()).toISOString(),
    };

    const receipt = await this.receipts.generateReceipt({
      receiptType: ReceiptType.PAYOUT,
      voyagexReference: payout.voyagexReference,
      metadata,
      bookingId: payout.bookingId,
      paymentId: payout.paymentId,
      payoutId: payout.id,
      providerReference: payout.providerReference ?? undefined,
    });

    await this.emailReceipt(
      payout.guides.users?.email,
      FINANCIAL_EMAIL_SUBJECTS.GUIDE_PAYOUT,
      receipt.id,
      receipt.receiptNumber,
    );
  }

  async completeSubscriptionPayment(subscriptionPaymentId: string): Promise<void> {
    const payment = await this.prisma.agency_subscription_payments.findUnique({
      where: { id: subscriptionPaymentId },
      include: {
        agencies: { include: { users: true } },
      },
    });
    if (!payment) return;

    await this.ledger.postEntry({
      ledgerType: LedgerType.AGENCY_SUBSCRIPTION,
      amount: payment.amount,
      currency: 'PKR',
      subscriptionPaymentId: payment.id,
      userId: payment.agencies.userId,
      remarks: 'Agency subscription payment received',
      idempotencyKey: `subscription:${payment.id}:payment`,
    });

    const ref = payment.transactionId ?? `SUB-${payment.id.slice(0, 8).toUpperCase()}`;
    const metadata: ReceiptMetadata = {
      status: 'ACTIVE',
      currency: 'PKR',
      paymentMethod: payment.paymentMethod,
      providerReference: payment.transactionId ?? undefined,
      voyagexReference: ref,
      transactionId: payment.transactionId ?? undefined,
      grossAmount: payment.amount,
      netAmount: payment.amount,
      agencyName: payment.agencies.name,
      timestamp: payment.paymentDate.toISOString(),
    };

    const receipt = await this.receipts.generateReceipt({
      receiptType: ReceiptType.SUBSCRIPTION,
      voyagexReference: ref,
      metadata,
      subscriptionPaymentId: payment.id,
      providerReference: payment.transactionId ?? undefined,
    });

    this.audit.log({
      action: 'subscription.activated',
      actorId: 'SYSTEM',
      resourceType: 'agency_subscription_payment',
      resourceId: payment.id,
      metadata: { agencyId: payment.agencyId, amount: payment.amount },
    });

    await this.emailReceipt(
      payment.agencies.users?.email,
      FINANCIAL_EMAIL_SUBJECTS.AGENCY_SUBSCRIPTION,
      receipt.id,
      receipt.receiptNumber,
    );
  }

  async completeRefund(refundId: string): Promise<void> {
    const refund = await this.prisma.refunds.findUnique({
      where: { id: refundId },
      include: {
        payments: { include: { users: true, bookings: true } },
      },
    });
    if (!refund) return;

    await this.ledger.postEntry({
      ledgerType: LedgerType.REFUND,
      amount: refund.amount,
      currency: refund.currency,
      bookingId: refund.bookingId,
      paymentId: refund.paymentId,
      userId: refund.payments?.userId,
      remarks: refund.reason,
      idempotencyKey: `refund:${refund.id}`,
    });

    const metadata: ReceiptMetadata = {
      status: 'REFUNDED',
      currency: refund.currency,
      voyagexReference: refund.providerRefundId ?? `REF-${refund.id.slice(0, 8)}`,
      transactionId: refund.payments?.transactionId ?? undefined,
      bookingId: refund.bookingId,
      grossAmount: refund.amount,
      netAmount: refund.amount,
      travelerName: refund.payments?.users
        ? `${refund.payments.users.firstName} ${refund.payments.users.lastName}`.trim()
        : undefined,
      timestamp: new Date().toISOString(),
    };

    const receipt = await this.receipts.generateReceipt({
      receiptType: ReceiptType.REFUND,
      voyagexReference: metadata.voyagexReference,
      metadata,
      bookingId: refund.bookingId,
      paymentId: refund.paymentId,
      status: ReceiptStatus.REFUNDED,
    });

    await this.emailReceipt(
      refund.payments?.users?.email,
      FINANCIAL_EMAIL_SUBJECTS.REFUND,
      receipt.id,
      receipt.receiptNumber,
    );
  }

  private async emailReceipt(
    to: string | undefined,
    subject: string,
    receiptId: string,
    receiptNumber: string,
  ): Promise<void> {
    if (!to) return;
    try {
      const pdfPath = await this.receipts.resolvePdfPath(receiptId);
      const email = this.moduleRef.get(EmailService, { strict: false });
      await email.sendReceiptEmail(to, subject, receiptNumber, pdfPath);
      await this.receipts.markEmailed(receiptId);
    } catch (error: unknown) {
      this.logger.warn(
        `Receipt email failed for ${receiptNumber}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
