import { Body, Controller, Headers, Ip, Post, Req } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, TrackPageViewDto, TrackSessionDto } from './dto/analytics.dto';

class LinkSessionUserDto {
  @IsUUID()
  sessionId!: string;
}

/**
 * Public, unauthenticated ingestion endpoints for first-party visitor
 * analytics (Phase N). Every route here is intentionally lightweight —
 * no heavy joins, no blocking calls — since these fire on every page load
 * for every visitor, logged in or not.
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('session')
  @Public()
  trackSession(
    @Body() body: TrackSessionDto,
    @Ip() ip: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: Request,
  ) {
    return this.analytics.trackSession(body, ip, headers, req);
  }

  @Post('pageview')
  @Public()
  trackPageView(@Body() body: TrackPageViewDto) {
    return this.analytics.trackPageView(body);
  }

  @Post('event')
  @Public()
  trackEvent(@Body() body: TrackEventDto) {
    return this.analytics.trackEvent(body);
  }

  /**
   * Authenticated (not @Public) — links the current session to the real
   * logged-in user id from the JWT, so "registered vs anonymous" counts
   * can never be spoofed by a client-supplied id.
   */
  @Post('link-user')
  async linkUser(@CurrentUser() user: { id: string }, @Body() body: LinkSessionUserDto) {
    await this.analytics.linkSessionUser(body.sessionId, user.id);
    return { ok: true };
  }
}
