import { Injectable } from '@nestjs/common';
import { LedgerEntryStatus, LedgerType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { FinancialReferenceService } from './financial-reference.service';

export type PostLedgerInput = {
  ledgerType: LedgerType;
  amount: number;
  currency?: string;
  bookingId?: string;
  paymentId?: string;
  payoutId?: string;
  subscriptionPaymentId?: string;
  userId?: string;
  remarks?: string;
  createdBy?: string;
  idempotencyKey: string;
};

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly references: FinancialReferenceService,
    private readonly audit: AuditService,
  ) {}

  async postEntry(
    input: PostLedgerInput,
    tx?: Prisma.TransactionClient,
  ): Promise<{ created: boolean; referenceNumber: string }> {
    const client = tx ?? this.prisma;

    const existing = await client.financial_ledger.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return { created: false, referenceNumber: existing.referenceNumber };
    }

    const referenceNumber = this.references.generateLedgerReference();
    await client.financial_ledger.create({
      data: {
        id: randomUUID(),
        ledgerType: input.ledgerType,
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        payoutId: input.payoutId,
        subscriptionPaymentId: input.subscriptionPaymentId,
        userId: input.userId,
        amount: input.amount,
        currency: input.currency ?? 'PKR',
        status: LedgerEntryStatus.POSTED,
        remarks: input.remarks,
        referenceNumber,
        idempotencyKey: input.idempotencyKey,
        createdBy: input.createdBy ?? 'SYSTEM',
      },
    });

    this.audit.log({
      action: 'financial.ledger.posted',
      actorId: input.createdBy ?? 'SYSTEM',
      resourceType: 'financial_ledger',
      resourceId: referenceNumber,
      metadata: {
        ledgerType: input.ledgerType,
        amount: input.amount,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return { created: true, referenceNumber };
  }
}
