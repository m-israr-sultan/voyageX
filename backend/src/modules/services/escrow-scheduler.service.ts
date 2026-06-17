import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingStatus, PaymentStatus, ReleaseSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoreService } from './core.service';

/**
 * Runs on a fixed schedule and automatically releases escrowed payments for bookings
 * where the traveler did not confirm within the auto-release window.
 *
 * Canonical hold deadline: payments.heldUntil
 *   Populated by initiatePayment: trip end date + PLATFORM_CONFIG.escrowGracePeriodDays.
 *   Fallback: booking creation + PLATFORM_CONFIG.escrowDefaultHoldDays.
 *
 * bookings.autoReleaseAt is kept for backward compatibility but is not the primary
 * read field. The scheduler reads payments.heldUntil.
 *
 * Idempotency guarantee:
 *   Only processes bookings with status=AWAITING_TRAVELER_CONFIRMATION and
 *   payment status=HELD with heldUntil <= now(). confirmCompletion itself guards
 *   against double-release by rejecting any payment not in HELD state.
 */
@Injectable()
export class EscrowSchedulerService {
  private readonly logger = new Logger(EscrowSchedulerService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly core: CoreService,
  ) {}

  // Cron: every 15 minutes  0 *\/15 * * * *  (seconds cron format)
  @Cron('0 */15 * * * *')
  async processOverdueEscrowReleases(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('EscrowScheduler: previous run still in progress — skipping this tick');
      return;
    }

    this.isRunning = true;
    const now = new Date();

    try {
      // Primary: use payments.heldUntil as the canonical deadline
      const overdueBookings = await this.prisma.bookings.findMany({
        where: {
          status: BookingStatus.AWAITING_TRAVELER_CONFIRMATION,
          payments: {
            status: PaymentStatus.HELD,
            heldUntil: { lte: now },
          },
        },
        select: {
          id: true,
          userId: true,
          totalPrice: true,
          autoReleaseAt: true,
          payments: { select: { heldUntil: true } },
        },
      });

      if (overdueBookings.length === 0) return;

      this.logger.log(
        `EscrowScheduler: found ${overdueBookings.length} overdue booking(s) for auto-release`,
      );

      const results = { released: 0, skipped: 0, failed: 0 };

      for (const booking of overdueBookings) {
        try {
          await this.core.confirmCompletion(
            booking.id,
            booking.userId,
            ReleaseSource.AUTO_RELEASE,
          );
          results.released++;
          this.logger.log(
            JSON.stringify({
              event: 'escrow.auto_released',
              bookingId: booking.id,
              totalPrice: booking.totalPrice,
              heldUntil: booking.payments?.heldUntil,
              processedAt: now.toISOString(),
            }),
          );
        } catch (err: unknown) {
          const message = (err as Error)?.message ?? String(err);
          if (
            message.includes('already in') ||
            message.includes('not awaiting confirmation')
          ) {
            results.skipped++;
            this.logger.warn(
              `EscrowScheduler: booking ${booking.id} skipped (already resolved): ${message}`,
            );
          } else {
            results.failed++;
            this.logger.error(
              `EscrowScheduler: failed to release booking ${booking.id}: ${message}`,
            );
          }
        }
      }

      this.logger.log(
        JSON.stringify({
          event: 'escrow.scheduler_run_complete',
          released: results.released,
          skipped: results.skipped,
          failed: results.failed,
          processedAt: now.toISOString(),
        }),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
