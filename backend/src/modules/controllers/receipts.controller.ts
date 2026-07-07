import { Body, Controller, Get, Headers, Param, Post, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { ReceiptService } from '../financial/services/receipt.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('receipts')
export class ReceiptsController {
  constructor(
    private readonly receipts: ReceiptService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('verify/:token')
  @Public()
  verify(@Param('token') token: string) {
    return this.receipts.verifyByToken(token);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const receipt = await this.prisma.receipts.findUnique({
      where: { id },
      include: {
        payments: { select: { userId: true } },
        payouts: { include: { guides: { select: { userId: true } } } },
        subscriptionPayment: { include: { agencies: { select: { userId: true } } } },
      },
    });
    if (!receipt) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner =
      receipt.payments?.userId === user.id ||
      receipt.payouts?.guides?.userId === user.id ||
      receipt.subscriptionPayment?.agencies?.userId === user.id;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const path = await this.receipts.resolvePdfPath(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${receipt.receiptNumber}.pdf"`,
    );
    createReadStream(path).pipe(res);
  }
}
