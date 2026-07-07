import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PayoutStatus } from '@prisma/client';
import { PLATFORM_CONFIG } from '../../../common/config/platform.config';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayoutOrchestrationService } from './payout-orchestration.service';

@Injectable()
export class PayoutRetrySchedulerService {
  private readonly logger = new Logger(PayoutRetrySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payoutOrchestration: PayoutOrchestrationService,
  ) {}

  // Every 30 minutes: retry failed payouts within retry budget
  @Cron('0 */30 * * * *')
  async retryFailedPayouts(): Promise<void> {
    const failed = await this.prisma.guide_payouts.findMany({
      where: {
        status: PayoutStatus.FAILED,
        retryCount: { lt: PLATFORM_CONFIG.payoutMaxRetries },
      },
      orderBy: { failedAt: 'asc' },
      take: 20,
    });

    for (const payout of failed) {
      try {
        await this.payoutOrchestration.retryPayout(payout.id);
        this.logger.log(`Retried payout ${payout.id} (attempt ${payout.retryCount + 1})`);
      } catch (error: unknown) {
        this.logger.error(
          `Payout retry failed id=${payout.id}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
  }
}
