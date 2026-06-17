-- Migration: add_payment_release_trail
-- Adds ReleaseSource enum and release-trail columns to the payments table.
-- Apply with: npx prisma db push  (or npx prisma migrate deploy when DB is online)

-- Create the ReleaseSource enum
CREATE TYPE "ReleaseSource" AS ENUM (
  'TRAVELER_CONFIRMATION',
  'AUTO_RELEASE',
  'ADMIN_OVERRIDE'
);

-- Add release-trail columns to payments
ALTER TABLE "payments"
  ADD COLUMN "releasedBy"    TEXT,
  ADD COLUMN "releaseSource" "ReleaseSource",
  ADD COLUMN "payoutAmount"  DOUBLE PRECISION;
