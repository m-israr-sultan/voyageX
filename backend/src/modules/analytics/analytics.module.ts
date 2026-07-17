import { Module } from '@nestjs/common';
import { AnalyticsAdminController } from './analytics-admin.controller';
import { AnalyticsAggregationScheduler } from './analytics-aggregation.scheduler';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController, AnalyticsAdminController],
  providers: [AnalyticsService, AnalyticsAggregationScheduler],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
