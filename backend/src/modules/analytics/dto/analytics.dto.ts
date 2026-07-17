import {
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Fixed catalog of device buckets — kept small on purpose (see schema comment). */
export const ANALYTICS_DEVICE_TYPES = ['MOBILE', 'DESKTOP', 'TABLET', 'UNKNOWN'] as const;

/** Fixed catalog of traffic sources tracked on the overview dashboard. */
export const ANALYTICS_TRAFFIC_SOURCES = [
  'GOOGLE',
  'FACEBOOK',
  'LINKEDIN',
  'INSTAGRAM',
  'TWITTER',
  'DIRECT',
  'REFERRAL',
  'OTHER',
] as const;

/**
 * Event catalog for the "understand where users drop off" tracking layer.
 * Deliberately a DTO-level `@IsIn` (not a DB enum) — new event names can be
 * added here without a migration; the column itself is a plain string.
 */
export const ANALYTICS_EVENT_TYPES = [
  'GUIDE_PROFILE_OPENED',
  'AGENCY_PROFILE_OPENED',
  'PACKAGE_VIEWED',
  'DESTINATION_VIEWED',
  'BOOKING_STARTED',
  'BOOKING_ABANDONED',
  'MESSAGE_STARTED',
] as const;

export class TrackSessionDto {
  @IsUUID()
  visitorId!: string;

  @IsUUID()
  sessionId!: string;

  @IsOptional() @IsIn(ANALYTICS_DEVICE_TYPES) device?: string;
  @IsOptional() @IsString() @MaxLength(120) browser?: string;
  @IsOptional() @IsString() @MaxLength(120) os?: string;
  @IsOptional() @IsInt() @Min(0) @Max(20000) screenWidth?: number;
  @IsOptional() @IsInt() @Min(0) @Max(20000) screenHeight?: number;
  @IsOptional() @IsString() @MaxLength(2000) referrer?: string;
  @IsOptional() @IsIn(ANALYTICS_TRAFFIC_SOURCES) trafficSource?: string;
  @IsOptional() @IsString() @MaxLength(500) landingPage?: string;
  @IsOptional() @IsString() @MaxLength(120) utmSource?: string;
}

export class TrackPageViewDto {
  @IsUUID()
  visitorId!: string;

  @IsUUID()
  sessionId!: string;

  @IsString() @MaxLength(500) path!: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) referrer?: string;
}

export class TrackEventDto {
  @IsUUID()
  visitorId!: string;

  @IsUUID()
  sessionId!: string;

  @IsIn(ANALYTICS_EVENT_TYPES)
  type!: string;

  @IsOptional() @IsIn(['guide', 'agency', 'package', 'destination', 'booking', 'conversation'])
  entityType?: string;

  @IsOptional() @IsString() @MaxLength(100) entityId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

/** Shared query filter for every admin analytics endpoint. */
export class AnalyticsRangeQueryDto {
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsIn(['day', 'week', 'month']) granularity?: 'day' | 'week' | 'month';
}
