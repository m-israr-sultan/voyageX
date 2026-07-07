import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ReceiptStatus,
  ReceiptType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppConfigService } from '../../../config/app-config.service';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { FinancialReferenceService } from './financial-reference.service';
import { ReceiptPdfService } from './receipt-pdf.service';
import type { ReceiptMetadata } from '../types/receipt-metadata.interface';

export type GenerateReceiptInput = {
  receiptType: ReceiptType;
  voyagexReference: string;
  metadata: ReceiptMetadata;
  bookingId?: string;
  paymentId?: string;
  payoutId?: string;
  subscriptionPaymentId?: string;
  providerReference?: string;
  status?: ReceiptStatus;
};

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly references: FinancialReferenceService,
    private readonly pdf: ReceiptPdfService,
    private readonly audit: AuditService,
    private readonly appConfig: AppConfigService,
  ) {}

  private idempotencyWhere(input: GenerateReceiptInput): Prisma.receiptsWhereInput {
    if (input.paymentId) {
      return { paymentId: input.paymentId, receiptType: input.receiptType };
    }
    if (input.payoutId) {
      return { payoutId: input.payoutId, receiptType: input.receiptType };
    }
    if (input.subscriptionPaymentId) {
      return {
        subscriptionPaymentId: input.subscriptionPaymentId,
        receiptType: input.receiptType,
      };
    }
    return { voyagexReference: input.voyagexReference, receiptType: input.receiptType };
  }

  async generateReceipt(input: GenerateReceiptInput): Promise<{ id: string; receiptNumber: string; pdfPath: string }> {
    const existing = await this.prisma.receipts.findFirst({
      where: this.idempotencyWhere(input),
    });
    if (existing?.pdfPath) {
      return {
        id: existing.id,
        receiptNumber: existing.receiptNumber,
        pdfPath: existing.pdfPath,
      };
    }

    const receiptNumber = this.references.generateReceiptNumber();
    const invoiceNumber = this.references.generateInvoiceNumber();
    const verificationToken = this.references.generateVerificationToken();
    const verificationUrl = `${this.appConfig.frontendUrl}/verify-receipt/${verificationToken}`;
    const now = new Date();

    const pdfPath = await this.pdf.generatePdf(
      receiptNumber,
      input.metadata,
      verificationUrl,
      verificationToken,
    );

    const receipt = await this.prisma.receipts.create({
      data: {
        id: randomUUID(),
        receiptNumber,
        invoiceNumber,
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        payoutId: input.payoutId,
        subscriptionPaymentId: input.subscriptionPaymentId,
        receiptType: input.receiptType,
        status: input.status ?? ReceiptStatus.VALID,
        pdfPath,
        verificationToken,
        verificationUrl,
        providerReference: input.providerReference,
        voyagexReference: input.voyagexReference,
        metadata: input.metadata as unknown as Prisma.InputJsonValue,
        generatedAt: now,
      },
    });

    this.audit.log({
      action: 'financial.receipt.created',
      actorId: 'SYSTEM',
      resourceType: 'receipt',
      resourceId: receipt.id,
      metadata: {
        receiptNumber,
        receiptType: input.receiptType,
        voyagexReference: input.voyagexReference,
      },
    });

    return { id: receipt.id, receiptNumber, pdfPath };
  }

  async markEmailed(receiptId: string): Promise<void> {
    await this.prisma.receipts.update({
      where: { id: receiptId },
      data: { emailedAt: new Date() },
    });
    this.audit.log({
      action: 'financial.receipt.emailed',
      actorId: 'SYSTEM',
      resourceType: 'receipt',
      resourceId: receiptId,
    });
  }

  getAbsolutePdfPath(pdfPath: string): string {
    return join(process.cwd(), 'uploads', pdfPath);
  }

  resolvePdfPath(receiptId: string): Promise<string> {
    return this.prisma.receipts
      .findUniqueOrThrow({ where: { id: receiptId } })
      .then((r) => {
        if (!r.pdfPath) throw new NotFoundException('Receipt PDF not found');
        const abs = this.getAbsolutePdfPath(r.pdfPath);
        if (!existsSync(abs)) throw new NotFoundException('Receipt PDF file missing');
        return abs;
      });
  }

  async verifyByToken(token: string) {
    const receipt = await this.prisma.receipts.findUnique({
      where: { verificationToken: token },
      include: {
        bookings: { select: { id: true, status: true } },
        payments: { select: { id: true, status: true, method: true } },
        payouts: { select: { id: true, status: true, provider: true } },
        subscriptionPayment: {
          select: { id: true, status: true, amount: true },
        },
      },
    });

    if (!receipt) {
      return { valid: false, status: 'INVALID' as const };
    }

    return {
      valid: receipt.status === ReceiptStatus.VALID,
      status: receipt.status,
      receiptNumber: receipt.receiptNumber,
      receiptType: receipt.receiptType,
      voyagexReference: receipt.voyagexReference,
      generatedAt: receipt.generatedAt,
      metadata: receipt.metadata,
    };
  }
}
