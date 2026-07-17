import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PLATFORM_CONFIG } from '../../common/config/platform.config';
import { TrackEventDto, TrackPageViewDto, TrackSessionDto } from './dto/analytics.dto';

interface DateRange {
  start: Date;
  end: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private uid(): string {
    return randomUUID();
  }

  private now(): Date {
    return new Date();
  }

  /** Resolves a query date range, defaulting to the last 30 days (inclusive of today). */
  private resolveRange(startDate?: string, endDate?: string): DateRange {
    const end = endDate ? new Date(endDate) : this.now();
    end.setHours(23, 59, 59, 999);
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 29 * DAY_MS);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  // ==========================================================
  // INGESTION (public, high-volume, must stay lightweight)
  // ==========================================================

  /**
   * Upserts a session. `userId` is client-supplied (the traveler/guide/etc.
   * already knows their own id when logged in) — this endpoint is
   * intentionally public/unauthenticated for low overhead, so we treat the
   * FK relation defensively: if the id doesn't correspond to a real user
   * (spoofed or stale), we silently drop it rather than fail the whole
   * request. This only ever affects analytics counts, never authorization.
   */
  async trackSession(
    dto: TrackSessionDto,
    ip: string | undefined,
    headers?: Record<string, string | string[] | undefined>,
    // Express request kept as an optional escape hatch for future geo headers.
    _req?: unknown,
  ): Promise<{ ok: true }> {
    const now = this.now();
    const geo = this.geoFromRequest(ip, headers);

    try {
      await this.prisma.analytics_sessions.upsert({
        where: { id: dto.sessionId },
        update: {
          lastSeenAt: now,
          // Fill geo once if the first ping arrived before a proxy header was present.
          ...(geo.country && { country: geo.country }),
          ...(geo.city && { city: geo.city }),
          ...(geo.region && { region: geo.region }),
        },
        create: {
          id: dto.sessionId,
          visitorId: dto.visitorId,
          country: geo.country,
          city: geo.city,
          region: geo.region,
          device: dto.device ?? 'UNKNOWN',
          browser: dto.browser,
          os: dto.os,
          screenWidth: dto.screenWidth,
          screenHeight: dto.screenHeight,
          referrer: dto.referrer,
          trafficSource: this.resolveTrafficSource(dto.referrer, dto.trafficSource, dto.utmSource),
          landingPage: dto.landingPage,
          startedAt: now,
          lastSeenAt: now,
        },
      });
    } catch (error) {
      this.logger.warn(`trackSession failed for session=${dto.sessionId}: ${(error as Error).message}`);
    }
    return { ok: true };
  }

  /** Links a session to a logged-in user without blocking the request on validation errors. */
  async linkSessionUser(sessionId: string, userId: string): Promise<void> {
    try {
      const user = await this.prisma.users.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) return;
      await this.prisma.analytics_sessions.update({
        where: { id: sessionId },
        data: { userId },
      });
    } catch {
      // Analytics is best-effort — never surface a failure to the caller.
    }
  }

  async trackPageView(dto: TrackPageViewDto): Promise<{ ok: true }> {
    try {
      await this.ensureSession(dto.sessionId, dto.visitorId);
      await this.prisma.analytics_page_views.create({
        data: {
          id: this.uid(),
          sessionId: dto.sessionId,
          path: dto.path,
          title: dto.title,
          referrer: dto.referrer,
        },
      });
      await this.prisma.analytics_sessions
        .update({ where: { id: dto.sessionId }, data: { lastSeenAt: this.now() } })
        .catch(() => undefined);
    } catch (error) {
      this.logger.warn(`trackPageView failed for session=${dto.sessionId}: ${(error as Error).message}`);
    }
    return { ok: true };
  }

  async trackEvent(dto: TrackEventDto): Promise<{ ok: true }> {
    try {
      await this.ensureSession(dto.sessionId, dto.visitorId);
      await this.prisma.analytics_events.create({
        data: {
          id: this.uid(),
          sessionId: dto.sessionId,
          type: dto.type,
          entityType: dto.entityType,
          entityId: dto.entityId,
          metadata: dto.metadata as never,
        },
      });
    } catch (error) {
      this.logger.warn(`trackEvent failed for session=${dto.sessionId}: ${(error as Error).message}`);
    }
    return { ok: true };
  }

  /** Pageview/event pings can arrive before the initial session ping under bad network conditions. */
  private async ensureSession(sessionId: string, visitorId: string): Promise<void> {
    const exists = await this.prisma.analytics_sessions.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (exists) return;
    const now = this.now();
    await this.prisma.analytics_sessions
      .create({ data: { id: sessionId, visitorId, device: 'UNKNOWN', startedAt: now, lastSeenAt: now } })
      .catch(() => undefined);
  }

  /**
   * Privacy-friendly geo: never call an external geo-IP SaaS. Prefer
   * headers already attached by the edge (Cloudflare / Vercel / Render).
   * Missing headers → null fields, surfaced as "Unknown" in the dashboard.
   */
  private geoFromRequest(
    _ip: string | undefined,
    headers?: Record<string, string | string[] | undefined>,
  ): { country?: string; city?: string; region?: string } {
    if (!headers) return {};
    const pick = (key: string): string | undefined => {
      const raw = headers[key] ?? headers[key.toLowerCase()];
      if (Array.isArray(raw)) return raw[0]?.trim() || undefined;
      if (typeof raw === 'string' && raw.trim()) return raw.trim();
      return undefined;
    };

    const countryRaw =
      pick('cf-ipcountry') ||
      pick('x-vercel-ip-country') ||
      pick('x-country-code') ||
      pick('cloudfront-viewer-country');
    const country =
      countryRaw && countryRaw.toUpperCase() !== 'XX' && countryRaw.toUpperCase() !== 'T1'
        ? countryRaw.toUpperCase()
        : undefined;

    const city =
      pick('cf-ipcity') ||
      pick('x-vercel-ip-city') ||
      pick('x-city');
    const region =
      pick('cf-region') ||
      pick('x-vercel-ip-country-region') ||
      pick('x-region');

    return { country, city: city ? decodeURIComponent(city) : undefined, region };
  }

  private resolveTrafficSource(referrer?: string, explicit?: string, utmSource?: string): string {
    if (explicit) return explicit;
    if (utmSource) {
      const s = utmSource.toLowerCase();
      if (s.includes('google')) return 'GOOGLE';
      if (s.includes('facebook') || s.includes('fb')) return 'FACEBOOK';
      if (s.includes('linkedin')) return 'LINKEDIN';
      if (s.includes('instagram')) return 'INSTAGRAM';
      if (s.includes('twitter') || s.includes('x.com')) return 'TWITTER';
      return 'OTHER';
    }
    if (!referrer) return 'DIRECT';
    const host = this.extractHost(referrer);
    if (!host) return 'DIRECT';
    if (host.includes('google.')) return 'GOOGLE';
    if (host.includes('facebook.') || host.includes('fb.com')) return 'FACEBOOK';
    if (host.includes('linkedin.')) return 'LINKEDIN';
    if (host.includes('instagram.')) return 'INSTAGRAM';
    if (host.includes('twitter.') || host.includes('x.com')) return 'TWITTER';
    if (host.includes('voyagextravel.com')) return 'DIRECT';
    return 'REFERRAL';
  }

  private extractHost(url: string): string | null {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  // ==========================================================
  // ADMIN — OVERVIEW
  // ==========================================================

  async getOverview(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveRange(startDate, endDate);
    const now = this.now();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now.getTime() - 7 * DAY_MS);
    const monthStart = new Date(now.getTime() - 30 * DAY_MS);

    const [totalVisitorsAgg, uniqueVisitorGroups, registeredGroups, priorVisitorGroups, pageViews] =
      await Promise.all([
        this.prisma.analytics_sessions.count({ where: { startedAt: { gte: start, lte: end } } }),
        this.prisma.analytics_sessions.groupBy({ by: ['visitorId'], where: { startedAt: { gte: start, lte: end } } }),
        this.prisma.analytics_sessions.groupBy({
          by: ['visitorId'],
          where: { startedAt: { gte: start, lte: end }, userId: { not: null } },
        }),
        this.prisma.analytics_sessions.groupBy({ by: ['visitorId'], where: { startedAt: { lt: start } } }),
        this.prisma.analytics_page_views.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);

    const priorVisitorSet = new Set(priorVisitorGroups.map((g) => g.visitorId));
    const uniqueVisitors = uniqueVisitorGroups.length;
    const returningVisitors = uniqueVisitorGroups.filter((g) => priorVisitorSet.has(g.visitorId)).length;
    const registeredActive = registeredGroups.length;
    const anonymousActive = uniqueVisitors - registeredActive;

    const [activeToday, activeWeek, activeMonth] = await Promise.all([
      this.prisma.analytics_sessions.groupBy({ by: ['visitorId'], where: { lastSeenAt: { gte: todayStart } } }),
      this.prisma.analytics_sessions.groupBy({ by: ['visitorId'], where: { lastSeenAt: { gte: weekStart } } }),
      this.prisma.analytics_sessions.groupBy({ by: ['visitorId'], where: { lastSeenAt: { gte: monthStart } } }),
    ]);

    return {
      range: { startDate: start, endDate: end },
      totalVisitors: totalVisitorsAgg,
      uniqueVisitors,
      returningVisitors,
      newVisitors: uniqueVisitors - returningVisitors,
      registeredActive,
      anonymousActive,
      pageViews,
      activeToday: activeToday.length,
      activeThisWeek: activeWeek.length,
      activeThisMonth: activeMonth.length,
    };
  }

  // ==========================================================
  // ADMIN — GEOGRAPHY
  // ==========================================================

  async getGeography(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveRange(startDate, endDate);
    const groups = await this.prisma.analytics_sessions.groupBy({
      by: ['country'],
      where: { startedAt: { gte: start, lte: end } },
      _count: { _all: true },
    });

    const countries = groups
      .map((g) => ({ country: g.country ?? 'Unknown', visitors: g._count._all }))
      .sort((a, b) => b.visitors - a.visitors);

    const total = countries.reduce((sum, c) => sum + c.visitors, 0) || 1;
    const pakistan = countries.filter((c) => c.country === 'Pakistan' || c.country === 'PK');
    const pakistanCount = pakistan.reduce((sum, c) => sum + c.visitors, 0);

    return {
      range: { startDate: start, endDate: end },
      topCountries: countries.slice(0, 10),
      allCountries: countries,
      pakistanVsInternational: {
        pakistan: pakistanCount,
        international: total - pakistanCount,
        pakistanPercent: Math.round((pakistanCount / total) * 1000) / 10,
      },
    };
  }

  // ==========================================================
  // ADMIN — TRAFFIC (pages + top entities)
  // ==========================================================

  async getTraffic(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveRange(startDate, endDate);

    const pageGroups = await this.prisma.analytics_page_views.groupBy({
      by: ['path'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
    });
    const topPages = pageGroups
      .map((g) => ({ path: g.path, views: g._count._all }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    const [guideViews, packageViews, destinationViews, agencyViews] = await Promise.all([
      this.topEntities(start, end, 'GUIDE_PROFILE_OPENED', 'guide'),
      this.topEntities(start, end, 'PACKAGE_VIEWED', 'package'),
      this.topEntities(start, end, 'DESTINATION_VIEWED', 'destination'),
      this.topEntities(start, end, 'AGENCY_PROFILE_OPENED', 'agency'),
    ]);

    const [mostViewedGuides, mostViewedPackages, mostViewedDestinations, mostViewedAgencies] = await Promise.all([
      this.enrichGuideNames(guideViews),
      this.enrichPackageNames(packageViews),
      this.enrichDestinationNames(destinationViews),
      this.enrichAgencyNames(agencyViews),
    ]);

    return {
      range: { startDate: start, endDate: end },
      topPages,
      mostViewedGuides,
      mostViewedPackages,
      mostViewedDestinations,
      mostViewedAgencies,
    };
  }

  private async topEntities(start: Date, end: Date, type: string, entityType: string) {
    const groups = await this.prisma.analytics_events.groupBy({
      by: ['entityId'],
      where: { createdAt: { gte: start, lte: end }, type, entityType, entityId: { not: null } },
      _count: { _all: true },
    });
    return groups
      .filter((g) => g.entityId)
      .map((g) => ({ entityId: g.entityId as string, views: g._count._all }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private async enrichGuideNames(rows: { entityId: string; views: number }[]) {
    if (rows.length === 0) return [];
    const guides = await this.prisma.guides.findMany({
      where: { id: { in: rows.map((r) => r.entityId) } },
      select: { id: true, slug: true, users: { select: { firstName: true, lastName: true } } },
    });
    const byId = new Map(guides.map((g) => [g.id, g]));
    return rows.map((r) => {
      const g = byId.get(r.entityId);
      return {
        id: r.entityId,
        views: r.views,
        name: g?.users ? `${g.users.firstName} ${g.users.lastName}`.trim() : 'Unknown guide',
        slug: g?.slug ?? null,
      };
    });
  }

  private async enrichPackageNames(rows: { entityId: string; views: number }[]) {
    if (rows.length === 0) return [];
    const packages = await this.prisma.packages.findMany({
      where: { id: { in: rows.map((r) => r.entityId) } },
      select: { id: true, slug: true, title: true },
    });
    const byId = new Map(packages.map((p) => [p.id, p]));
    return rows.map((r) => {
      const p = byId.get(r.entityId);
      return { id: r.entityId, views: r.views, name: p?.title ?? 'Unknown package', slug: p?.slug ?? null };
    });
  }

  private async enrichDestinationNames(rows: { entityId: string; views: number }[]) {
    if (rows.length === 0) return [];
    const destinations = await this.prisma.destinations.findMany({
      where: { id: { in: rows.map((r) => r.entityId) } },
      select: { id: true, slug: true, name: true },
    });
    const byId = new Map(destinations.map((d) => [d.id, d]));
    return rows.map((r) => {
      const d = byId.get(r.entityId);
      return { id: r.entityId, views: r.views, name: d?.name ?? 'Unknown destination', slug: d?.slug ?? null };
    });
  }

  private async enrichAgencyNames(rows: { entityId: string; views: number }[]) {
    if (rows.length === 0) return [];
    const agencies = await this.prisma.agencies.findMany({
      where: { id: { in: rows.map((r) => r.entityId) } },
      select: { id: true, slug: true, name: true },
    });
    const byId = new Map(agencies.map((a) => [a.id, a]));
    return rows.map((r) => {
      const a = byId.get(r.entityId);
      return { id: r.entityId, views: r.views, name: a?.name ?? 'Unknown agency', slug: a?.slug ?? null };
    });
  }

  // ==========================================================
  // ADMIN — DEVICES
  // ==========================================================

  async getDevices(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveRange(startDate, endDate);
    const [deviceGroups, browserGroups, osGroups] = await Promise.all([
      this.prisma.analytics_sessions.groupBy({
        by: ['device'],
        where: { startedAt: { gte: start, lte: end } },
        _count: { _all: true },
      }),
      this.prisma.analytics_sessions.groupBy({
        by: ['browser'],
        where: { startedAt: { gte: start, lte: end }, browser: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.analytics_sessions.groupBy({
        by: ['os'],
        where: { startedAt: { gte: start, lte: end }, os: { not: null } },
        _count: { _all: true },
      }),
    ]);

    return {
      range: { startDate: start, endDate: end },
      devices: deviceGroups
        .map((g) => ({ device: g.device ?? 'UNKNOWN', sessions: g._count._all }))
        .sort((a, b) => b.sessions - a.sessions),
      browsers: browserGroups
        .map((g) => ({ browser: g.browser ?? 'Unknown', sessions: g._count._all }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10),
      operatingSystems: osGroups
        .map((g) => ({ os: g.os ?? 'Unknown', sessions: g._count._all }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10),
    };
  }

  // ==========================================================
  // ADMIN — TRAFFIC SOURCES
  // ==========================================================

  async getSources(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveRange(startDate, endDate);
    const groups = await this.prisma.analytics_sessions.groupBy({
      by: ['trafficSource'],
      where: { startedAt: { gte: start, lte: end } },
      _count: { _all: true },
    });
    return {
      range: { startDate: start, endDate: end },
      sources: groups
        .map((g) => ({ source: g.trafficSource ?? 'DIRECT', sessions: g._count._all }))
        .sort((a, b) => b.sessions - a.sessions),
    };
  }

  // ==========================================================
  // ADMIN — FOUNDER BUSINESS METRICS
  // ==========================================================

  async getBusinessMetrics(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveRange(startDate, endDate);

    const [
      totalGuides,
      verifiedGuides,
      totalAgencies,
      verifiedAgencies,
      totalPackages,
      bookingsCreated,
      bookingsCompleted,
      bookingsCancelled,
      disputes,
    ] = await Promise.all([
      this.prisma.guides.count(),
      this.prisma.guides.count({ where: { isVerified: true, adminApproved: true } }),
      this.prisma.agencies.count(),
      this.prisma.agencies.count({ where: { isVerified: true, adminApproved: true } }),
      this.prisma.packages.count({ where: { isActive: true } }),
      this.prisma.bookings.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.bookings.count({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } } }),
      this.prisma.bookings.count({ where: { status: 'CANCELLED', createdAt: { gte: start, lte: end } } }),
      this.prisma.disputes.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);

    const cancellationRate = bookingsCreated > 0 ? Math.round((bookingsCancelled / bookingsCreated) * 1000) / 10 : 0;

    const bookingsTimeseries = await this.prisma.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*) as total
      FROM "bookings"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;

    return {
      range: { startDate: start, endDate: end },
      totalGuides,
      verifiedGuides,
      totalAgencies,
      verifiedAgencies,
      totalPackages,
      bookingsCreated,
      bookingsCompleted,
      bookingsCancelled,
      disputes,
      cancellationRate,
      bookingsTimeseries: bookingsTimeseries.map((r) => ({ date: r.day, count: Number(r.total) })),
    };
  }

  // ==========================================================
  // ADMIN — VISITOR TIMESERIES (line chart)
  // ==========================================================

  async getVisitorTimeseries(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveRange(startDate, endDate);
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; visitors: bigint; sessions: bigint }>>`
      SELECT
        DATE_TRUNC('day', "startedAt") as day,
        COUNT(DISTINCT "visitorId") as visitors,
        COUNT(*) as sessions
      FROM "analytics_sessions"
      WHERE "startedAt" >= ${start} AND "startedAt" <= ${end}
      GROUP BY DATE_TRUNC('day', "startedAt")
      ORDER BY day ASC
    `;
    return {
      range: { startDate: start, endDate: end },
      series: rows.map((r) => ({ date: r.day, visitors: Number(r.visitors), sessions: Number(r.sessions) })),
    };
  }

  // ==========================================================
  // AGGREGATION (called by scheduler)
  // ==========================================================

  /** Rolls up one full UTC day of raw analytics into `analytics_daily_stats`. Idempotent (upsert). */
  async aggregateDay(day: Date): Promise<void> {
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + DAY_MS - 1);
    const iso = start.toISOString().slice(0, 10);

    const overview = await this.getOverview(iso, iso);
    const geo = await this.getGeography(iso, iso);
    const devices = await this.getDevices(iso, iso);
    const sources = await this.getSources(iso, iso);
    const traffic = await this.getTraffic(iso, iso);
    const pageViews = await this.prisma.analytics_page_views.count({ where: { createdAt: { gte: start, lte: end } } });

    const now = this.now();
    await this.prisma.analytics_daily_stats.upsert({
      where: { date: start },
      update: {
        totalVisitors: overview.totalVisitors,
        uniqueVisitors: overview.uniqueVisitors,
        returningVisitors: overview.returningVisitors,
        registeredActive: overview.registeredActive,
        anonymousActive: overview.anonymousActive,
        pageViews,
        countryCounts: geo.topCountries as never,
        deviceCounts: devices.devices as never,
        sourceCounts: sources.sources as never,
        topPages: traffic.topPages as never,
        topGuides: traffic.mostViewedGuides as never,
        topPackages: traffic.mostViewedPackages as never,
        topDestinations: traffic.mostViewedDestinations as never,
        updatedAt: now,
      },
      create: {
        id: this.uid(),
        date: start,
        totalVisitors: overview.totalVisitors,
        uniqueVisitors: overview.uniqueVisitors,
        returningVisitors: overview.returningVisitors,
        registeredActive: overview.registeredActive,
        anonymousActive: overview.anonymousActive,
        pageViews,
        countryCounts: geo.topCountries as never,
        deviceCounts: devices.devices as never,
        sourceCounts: sources.sources as never,
        topPages: traffic.topPages as never,
        topGuides: traffic.mostViewedGuides as never,
        topPackages: traffic.mostViewedPackages as never,
        topDestinations: traffic.mostViewedDestinations as never,
        updatedAt: now,
      },
    });
  }

  /** Deletes raw events/pageviews/sessions older than the configured retention window. */
  async pruneOldData(): Promise<{ sessions: number }> {
    const cutoff = new Date(this.now().getTime() - PLATFORM_CONFIG.analyticsRetentionDays * DAY_MS);
    // Child rows (page_views/events) cascade-delete with their session.
    const result = await this.prisma.analytics_sessions.deleteMany({ where: { startedAt: { lt: cutoff } } });
    return { sessions: result.count };
  }
}
