import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReconciliationService } from './reconciliation.service';

@Injectable()
export class ReconciliationSchedulerService {
  private readonly logger = new Logger(ReconciliationSchedulerService.name);

  constructor(private readonly reconciliation: ReconciliationService) {}

  @Cron('0 2 * * *')
  async runDaily(): Promise<void> {
    try {
      await this.reconciliation.runDaily();
      this.logger.log('Daily reconciliation completed');
    } catch (error: unknown) {
      this.logger.error(
        `Daily reconciliation failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  @Cron('0 3 * * 1')
  async runWeekly(): Promise<void> {
    try {
      await this.reconciliation.runWeekly();
      this.logger.log('Weekly reconciliation completed');
    } catch (error: unknown) {
      this.logger.error(
        `Weekly reconciliation failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  @Cron('0 4 1 * *')
  async runMonthly(): Promise<void> {
    try {
      await this.reconciliation.runMonthly();
      this.logger.log('Monthly reconciliation completed');
    } catch (error: unknown) {
      this.logger.error(
        `Monthly reconciliation failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
