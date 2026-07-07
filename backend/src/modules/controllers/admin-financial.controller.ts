import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceiptService } from '../financial/services/receipt.service';
import { FinancialListQueryDto } from '../dto/financial.dto';

@Controller('admin/financial')
@Roles(UserRole.ADMIN)
export class AdminFinancialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receipts: ReceiptService,
  ) {}

  @Get('receipts')
  async listReceipts(@Query() query: FinancialListQueryDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = Math.min(query.limit ? parseInt(query.limit, 10) : 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.type) where.receiptType = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { receiptNumber: { contains: query.search, mode: 'insensitive' } },
        { voyagexReference: { contains: query.search, mode: 'insensitive' } },
        { providerReference: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.receipts.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          bookings: { select: { id: true } },
          payments: { select: { id: true, method: true } },
          payouts: { select: { id: true, provider: true } },
          subscriptionPayment: {
            select: { id: true, agencies: { select: { name: true } } },
          },
        },
      }),
      this.prisma.receipts.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('ledger')
  async listLedger(@Query() query: FinancialListQueryDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = Math.min(query.limit ? parseInt(query.limit, 10) : 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.type) where.ledgerType = query.type;
    if (query.search) {
      where.OR = [
        { referenceNumber: { contains: query.search, mode: 'insensitive' } },
        { remarks: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.financial_ledger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          bookings: { select: { id: true } },
          payments: { select: { id: true, transactionId: true } },
          payouts: { select: { id: true, voyagexReference: true } },
          subscriptionPayment: {
            select: { id: true, agencies: { select: { name: true } } },
          },
        },
      }),
      this.prisma.financial_ledger.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('receipts/:id/download')
  async downloadReceipt(@Param('id') id: string, @Res() res: Response) {
    const receipt = await this.prisma.receipts.findUniqueOrThrow({ where: { id } });
    const path = await this.receipts.resolvePdfPath(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${receipt.receiptNumber}.pdf"`,
    );
    createReadStream(path).pipe(res);
  }
}
