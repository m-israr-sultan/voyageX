import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRangeQueryDto } from './dto/analytics.dto';

/**
 * Admin-only analytics + founder business-intelligence dashboard endpoints
 * (Phase M). Every route accepts optional `startDate`/`endDate` (ISO date
 * strings) — defaults to the trailing 30 days.
 */
@Controller('admin/analytics')
@Roles(UserRole.ADMIN)
export class AnalyticsAdminController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getOverview(query.startDate, query.endDate);
  }

  @Get('geography')
  geography(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getGeography(query.startDate, query.endDate);
  }

  @Get('traffic')
  traffic(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getTraffic(query.startDate, query.endDate);
  }

  @Get('devices')
  devices(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getDevices(query.startDate, query.endDate);
  }

  @Get('sources')
  sources(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getSources(query.startDate, query.endDate);
  }

  @Get('business')
  business(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getBusinessMetrics(query.startDate, query.endDate);
  }

  @Get('timeseries')
  timeseries(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getVisitorTimeseries(query.startDate, query.endDate);
  }
}
