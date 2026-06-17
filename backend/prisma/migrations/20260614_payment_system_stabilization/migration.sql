-- VoyageX Payment System Stabilization Migration
-- Generated: 2026-06-14
-- 
-- Summary of changes:
--   1. PaymentMethod enum: remove MANUAL, CASH; add CARD
--   2. PaymentStatus enum: add PENDING_REVIEW, CONFIRMED, PARTIALLY_RELEASED, CANCELLED
--   3. New enums: SubscriptionPaymentStatus, RefundStatus, InternationalBookingStatus
--   4. New enum values: SubscriptionStatus.PENDING_REVIEW
--   5. NotificationType: rename MANUAL_BOOKING_* → INTERNATIONAL_BOOKING_*,
--      add PAYMENT_PROOF_* values, COMMISSION_DUE, COMMISSION_OVERDUE
--   6. payments table: add providerTransactionId, proofUrl, platformFee,
--      netAmount, cardToken columns; releaseSource, releasedBy, payoutAmount already added
--   7. agency_subscription_payments: status String → SubscriptionPaymentStatus enum,
--      add rejectionReason, proofUrl
--   8. Rename manual_booking_assignments → international_booking_assignments
--   9. bookings: rename manualBookingStatus → internationalBookingStatus,
--      ManualBookingStatus enum → InternationalBookingStatus
--  10. Create refunds table with RefundStatus enum
--
-- IMPORTANT: Run data migrations BEFORE enum changes.
-- IMPORTANT: Apply only when PostgreSQL server is available.

-- ============================================================
-- STEP 1: Create new enums
-- ============================================================

CREATE TYPE "SubscriptionPaymentStatus" AS ENUM (
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "RefundStatus" AS ENUM (
  'PENDING',
  'PROCESSED',
  'FAILED'
);

CREATE TYPE "InternationalBookingStatus" AS ENUM (
  'PENDING_REVIEW',
  'AWAITING_PAYMENT',
  'PAYMENT_RECEIVED',
  'GUIDE_ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

-- ============================================================
-- STEP 2: Extend existing enums (safe — only adds values)
-- ============================================================

-- PaymentStatus: add new statuses
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_RELEASED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- SubscriptionStatus: add PENDING_REVIEW
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';

-- NotificationType: add new types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_PROOF_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_PROOF_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_PROOF_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INTERNATIONAL_BOOKING_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INTERNATIONAL_BOOKING_PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMMISSION_DUE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMMISSION_OVERDUE';

-- ============================================================
-- STEP 3: Migrate PaymentMethod enum
--   Old: EASYPAISA, JAZZCASH, BANK_TRANSFER, MANUAL, CASH
--   New: EASYPAISA, JAZZCASH, CARD, BANK_TRANSFER
-- Postgres cannot remove enum values directly.
-- Create new enum, migrate columns, drop old enum.
-- ============================================================

-- 3a. Data migration: convert banned values to BANK_TRANSFER before changing type
UPDATE "payments"
  SET "method" = 'BANK_TRANSFER'
  WHERE "method" IN ('MANUAL', 'CASH');

UPDATE "bookings"
  SET "paymentMethod" = NULL
  WHERE "paymentMethod" IN ('MANUAL', 'CASH');

UPDATE "agency_subscription_payments"
  SET "paymentMethod" = 'BANK_TRANSFER'
  WHERE "paymentMethod" IN ('MANUAL', 'CASH');

-- 3b. Add CARD to existing PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CARD';

-- 3c. Remove MANUAL and CASH from PaymentMethod enum
--     (Postgres requires creating a new enum type)
CREATE TYPE "PaymentMethod_new" AS ENUM (
  'EASYPAISA',
  'JAZZCASH',
  'CARD',
  'BANK_TRANSFER'
);

-- 3d. Migrate all columns using the old enum
ALTER TABLE "payments"
  ALTER COLUMN "method" TYPE "PaymentMethod_new"
  USING "method"::text::"PaymentMethod_new";

ALTER TABLE "bookings"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING "paymentMethod"::text::"PaymentMethod_new";

ALTER TABLE "agency_subscription_payments"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING "paymentMethod"::text::"PaymentMethod_new";

-- 3e. Drop old enum, rename new enum
DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";

-- ============================================================
-- STEP 4: Migrate ManualBookingStatus enum →
--         InternationalBookingStatus
-- ============================================================

-- 4a. Data migration: rename old values to new values
UPDATE "bookings"
  SET "manualBookingStatus" = 'PENDING_REVIEW'
  WHERE "manualBookingStatus" = 'PENDING_MANUAL';

-- 4b. Create new type
CREATE TYPE "ManualBookingStatus_new" AS ENUM (
  'PENDING_REVIEW',
  'AWAITING_PAYMENT',
  'PAYMENT_RECEIVED',
  'GUIDE_ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

-- 4c. Migrate the column (old type was ManualBookingStatus)
ALTER TABLE "bookings"
  ALTER COLUMN "manualBookingStatus" TYPE "ManualBookingStatus_new"
  USING "manualBookingStatus"::text::"ManualBookingStatus_new";

-- 4d. Drop old enum, rename column and type
DROP TYPE "ManualBookingStatus";
ALTER TYPE "ManualBookingStatus_new" RENAME TO "InternationalBookingStatus";
ALTER TABLE "bookings"
  RENAME COLUMN "manualBookingStatus" TO "internationalBookingStatus";

-- ============================================================
-- STEP 5: Update agency_subscription_payments.status
--   Old: status String (values "SUCCESS", "REJECTED:reason")
--   New: status SubscriptionPaymentStatus enum
-- ============================================================

-- 5a. Add new enum column
ALTER TABLE "agency_subscription_payments"
  ADD COLUMN "status_new" "SubscriptionPaymentStatus" DEFAULT 'PENDING_REVIEW';

-- 5b. Data migration
UPDATE "agency_subscription_payments"
  SET "status_new" = 'APPROVED'
  WHERE "status" = 'SUCCESS' OR "status" = 'APPROVED';

UPDATE "agency_subscription_payments"
  SET "status_new" = 'REJECTED'
  WHERE "status" LIKE 'REJECTED%' OR "status" = 'REJECTED';

-- 5c. Add rejectionReason column and populate from old status hack
ALTER TABLE "agency_subscription_payments"
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

UPDATE "agency_subscription_payments"
  SET "rejectionReason" = SPLIT_PART("status", ':', 2)
  WHERE "status" LIKE 'REJECTED:%';

-- 5d. Add proofUrl column
ALTER TABLE "agency_subscription_payments"
  ADD COLUMN IF NOT EXISTS "proofUrl" TEXT;

-- 5e. Drop old string column, rename new column
ALTER TABLE "agency_subscription_payments"
  DROP COLUMN "status";
ALTER TABLE "agency_subscription_payments"
  RENAME COLUMN "status_new" TO "status";

-- ============================================================
-- STEP 6: Add new columns to payments table
-- ============================================================

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "providerTransactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "proofUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "cardToken" TEXT,
  ADD COLUMN IF NOT EXISTS "platformFee" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "netAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "heldUntil" TIMESTAMP(3);

-- releaseSource column (from previous migration — add if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='releasedBy'
  ) THEN
    ALTER TABLE "payments"
      ADD COLUMN "releasedBy" TEXT,
      ADD COLUMN "releaseSource" "ReleaseSource",
      ADD COLUMN "payoutAmount" DOUBLE PRECISION;
  END IF;
END$$;

-- ============================================================
-- STEP 7: Rename manual_booking_assignments table
-- ============================================================

ALTER TABLE IF EXISTS "manual_booking_assignments"
  RENAME TO "international_booking_assignments";

-- ============================================================
-- STEP 8: Remove MANUAL_BOOKING_* from NotificationType enum
--         (cannot remove enum values in Postgres directly —
--          values are replaced by the newly added
--          INTERNATIONAL_BOOKING_* equivalents in code.
--          Old rows in notifications table will remain valid
--          because we cannot remove enum values without
--          rebuilding the type. They will display via
--          the default notification handler.)
-- ============================================================

-- No destructive action here — old rows are preserved.
-- Application code no longer writes MANUAL_BOOKING_* values.

-- ============================================================
-- STEP 9: Create refunds table
-- ============================================================

CREATE TABLE IF NOT EXISTS "refunds" (
  "id"                TEXT         NOT NULL,
  "bookingId"         TEXT         NOT NULL,
  "paymentId"         TEXT         NOT NULL,
  "amount"            DOUBLE PRECISION NOT NULL,
  "currency"          TEXT         NOT NULL DEFAULT 'PKR',
  "reason"            TEXT         NOT NULL,
  "status"            "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "initiatedById"     TEXT         NOT NULL,
  "providerRefundId"  TEXT,
  "processedAt"       TIMESTAMP(3),
  "notes"             TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refunds_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id"),
  CONSTRAINT "refunds_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id"),
  CONSTRAINT "refunds_initiatedById_fkey"
    FOREIGN KEY ("initiatedById") REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "refunds_bookingId_idx" ON "refunds"("bookingId");
CREATE INDEX IF NOT EXISTS "refunds_paymentId_idx" ON "refunds"("paymentId");

-- ============================================================
-- STEP 10: Add bookings.isInternational column if missing
-- ============================================================

ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "isInternational" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: any booking with an internationalBookingStatus is international
UPDATE "bookings"
  SET "isInternational" = true
  WHERE "internationalBookingStatus" IS NOT NULL;

-- ============================================================
-- DONE
-- Run: npx prisma generate   (updates TypeScript client)
-- Run: npm run build          (verifies compilation)
-- ============================================================
