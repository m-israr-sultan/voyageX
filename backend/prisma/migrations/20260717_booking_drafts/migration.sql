-- Phase E — Booking Lifecycle Hardening.
-- Adds the booking_drafts (CheckoutSession) table so a real `bookings` row
-- is never created until the traveler actually submits payment. Traveler
-- Details -> Billing steps now persist a server-side draft here; only the
-- final POST /bookings/drafts/:id/checkout action creates the real booking
-- (atomically with payment initiation).
-- Apply with: npx prisma migrate deploy (or npx prisma db push when DB is online)

CREATE TABLE IF NOT EXISTS "booking_drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT,
    "guideId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "groupSize" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "pricingModel" "PricingModel" NOT NULL DEFAULT 'PER_PERSON',
    "isInternational" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_drafts_userId_idx" ON "booking_drafts"("userId");
CREATE INDEX IF NOT EXISTS "booking_drafts_expiresAt_idx" ON "booking_drafts"("expiresAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_drafts_userId_fkey'
    ) THEN
        ALTER TABLE "booking_drafts"
            ADD CONSTRAINT "booking_drafts_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
