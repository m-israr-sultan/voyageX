import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';

/**
 * Phase N — nightly rollup of the previous day's raw analytics into
 * `analytics_daily_stats`, plus retention pruning of old raw rows. Keeps
 * the admin dashboard fast (reads a handful of rows instead of scanning
 * months of page views) and keeps the raw tables from growing forever.
 */
@Injectable()
export class AnalyticsAggregationScheduler {
  private readonly logger = new Logger(AnalyticsAggregationScheduler.name);

  constructor(private readonly analytics: AnalyticsService) {}

  /** Runs at 00:15 every day — aggregates the full day that just ended. */
  @Cron('0 15 0 * * *')
  async aggregateYesterday(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    try {
      await this.analytics.aggregateDay(yesterday);
      this.logger.log(`Aggregated analytics for ${yesterday.toISOString().slice(0, 10)}`);
    } catch (error) {
      this.logger.error(`Daily analytics aggregation failed: ${(error as Error).message}`);
    }
  }

  /** Runs weekly (Sunday 01:00) — prunes raw analytics rows past the retention window. */
  @Cron('0 0 1 * * 0')
  async pruneOldData(): Promise<void> {
    try {
      const result = await this.analytics.pruneOldData();
      if (result.sessions > 0) {
        this.logger.log(`Pruned ${result.sessions} expired analytics session(s)`);
      }
    } catch (error) {
      this.logger.error(`Analytics retention pruning failed: ${(error as Error).message}`);
    }
  }
}
