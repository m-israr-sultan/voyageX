-- Phase N — Analytics Infrastructure.
-- Adds first-party, privacy-friendly visitor analytics tables (sessions,
-- page views, events) plus a pre-aggregated daily rollup table used by the
-- admin analytics dashboard (Phase M). No third-party trackers involved.
-- Apply with: npx prisma migrate deploy (or npx prisma db push when DB is online)

CREATE TABLE IF NOT EXISTS "analytics_sessions" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "referrer" TEXT,
    "trafficSource" TEXT,
    "landingPage" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_sessions_visitorId_idx" ON "analytics_sessions"("visitorId");
CREATE INDEX IF NOT EXISTS "analytics_sessions_userId_idx" ON "analytics_sessions"("userId");
CREATE INDEX IF NOT EXISTS "analytics_sessions_startedAt_idx" ON "analytics_sessions"("startedAt");
CREATE INDEX IF NOT EXISTS "analytics_sessions_lastSeenAt_idx" ON "analytics_sessions"("lastSeenAt");
CREATE INDEX IF NOT EXISTS "analytics_sessions_country_idx" ON "analytics_sessions"("country");
CREATE INDEX IF NOT EXISTS "analytics_sessions_device_idx" ON "analytics_sessions"("device");
CREATE INDEX IF NOT EXISTS "analytics_sessions_trafficSource_idx" ON "analytics_sessions"("trafficSource");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'analytics_sessions_userId_fkey'
    ) THEN
        ALTER TABLE "analytics_sessions"
            ADD CONSTRAINT "analytics_sessions_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "analytics_page_views" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_page_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_page_views_sessionId_idx" ON "analytics_page_views"("sessionId");
CREATE INDEX IF NOT EXISTS "analytics_page_views_path_idx" ON "analytics_page_views"("path");
CREATE INDEX IF NOT EXISTS "analytics_page_views_createdAt_idx" ON "analytics_page_views"("createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'analytics_page_views_sessionId_fkey'
    ) THEN
        ALTER TABLE "analytics_page_views"
            ADD CONSTRAINT "analytics_page_views_sessionId_fkey"
            FOREIGN KEY ("sessionId") REFERENCES "analytics_sessions"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");
CREATE INDEX IF NOT EXISTS "analytics_events_type_idx" ON "analytics_events"("type");
CREATE INDEX IF NOT EXISTS "analytics_events_entityType_entityId_idx" ON "analytics_events"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_sessionId_fkey'
    ) THEN
        ALTER TABLE "analytics_events"
            ADD CONSTRAINT "analytics_events_sessionId_fkey"
            FOREIGN KEY ("sessionId") REFERENCES "analytics_sessions"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "analytics_daily_stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalVisitors" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "returningVisitors" INTEGER NOT NULL DEFAULT 0,
    "registeredActive" INTEGER NOT NULL DEFAULT 0,
    "anonymousActive" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "countryCounts" JSONB,
    "deviceCounts" JSONB,
    "sourceCounts" JSONB,
    "topPages" JSONB,
    "topGuides" JSONB,
    "topPackages" JSONB,
    "topDestinations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_daily_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "analytics_daily_stats_date_key" ON "analytics_daily_stats"("date");
CREATE INDEX IF NOT EXISTS "analytics_daily_stats_date_idx" ON "analytics_daily_stats"("date");
