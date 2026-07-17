import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Phase E — purges expired BookingDraft (CheckoutSession) rows so abandoned
 * checkouts don't accumulate. Drafts never hold money or a real booking —
 * this is pure housekeeping, safe to run frequently.
 */
@Injectable()
export class BookingDraftCleanupService {
  private readonly logger = new Logger(BookingDraftCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Run every 15 minutes */
  @Cron('0 */15 * * * *')
  async purgeExpiredDrafts(): Promise<void> {
    const result = await this.prisma.booking_drafts.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.log(`Purged ${result.count} expired booking draft(s)`);
    }
  }
}
