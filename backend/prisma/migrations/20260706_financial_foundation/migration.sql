-- VoyageX Financial Foundation (Phase A)
-- Adds payout accounts, guide payouts, financial ledger, and receipts.

-- CreateEnum
CREATE TYPE "PayoutProvider" AS ENUM ('EASYPAISA', 'JAZZCASH', 'BANK');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');
CREATE TYPE "PayoutAccountStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'REJECTED');
CREATE TYPE "LedgerType" AS ENUM (
  'TRAVELER_PAYMENT',
  'ESCROW_HOLD',
  'ESCROW_RELEASE',
  'GUIDE_PAYOUT',
  'AGENCY_SUBSCRIPTION',
  'REFUND',
  'COMMISSION',
  'REVERSAL',
  'ADJUSTMENT'
);
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING', 'POSTED', 'REVERSED');
CREATE TYPE "ReceiptType" AS ENUM ('PAYMENT', 'PAYOUT', 'ESCROW', 'SUBSCRIPTION', 'REFUND');

-- CreateTable guide_payout_accounts
CREATE TABLE "guide_payout_accounts" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "provider" "PayoutProvider" NOT NULL,
    "accountTitle" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "iban" TEXT,
    "bankName" TEXT,
    "accountStatus" "PayoutAccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable guide_payouts
CREATE TABLE "guide_payouts" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "provider" "PayoutProvider" NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "providerReference" TEXT,
    "voyagexReference" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable financial_ledger
CREATE TABLE "financial_ledger" (
    "id" TEXT NOT NULL,
    "ledgerType" "LedgerType" NOT NULL,
    "bookingId" TEXT,
    "paymentId" TEXT,
    "payoutId" TEXT,
    "userId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "status" "LedgerEntryStatus" NOT NULL DEFAULT 'POSTED',
    "beforeBalance" DOUBLE PRECISION,
    "afterBalance" DOUBLE PRECISION,
    "remarks" TEXT,
    "referenceNumber" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable receipts
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "bookingId" TEXT,
    "paymentId" TEXT,
    "payoutId" TEXT,
    "receiptType" "ReceiptType" NOT NULL,
    "pdfPath" TEXT,
    "verificationToken" TEXT NOT NULL,
    "verificationUrl" TEXT,
    "providerReference" TEXT,
    "voyagexReference" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- Indexes guide_payout_accounts
CREATE INDEX "guide_payout_accounts_guideId_idx" ON "guide_payout_accounts"("guideId");
CREATE INDEX "guide_payout_accounts_guideId_isDefault_idx" ON "guide_payout_accounts"("guideId", "isDefault");
CREATE INDEX "guide_payout_accounts_accountStatus_idx" ON "guide_payout_accounts"("accountStatus");
CREATE UNIQUE INDEX "guide_payout_accounts_guideId_provider_iban_key" ON "guide_payout_accounts"("guideId", "provider", "iban");
CREATE UNIQUE INDEX "guide_payout_accounts_guideId_provider_mobileNumber_key" ON "guide_payout_accounts"("guideId", "provider", "mobileNumber");

-- Indexes guide_payouts
CREATE UNIQUE INDEX "guide_payouts_voyagexReference_key" ON "guide_payouts"("voyagexReference");
CREATE UNIQUE INDEX "guide_payouts_bookingId_paymentId_key" ON "guide_payouts"("bookingId", "paymentId");
CREATE INDEX "guide_payouts_guideId_idx" ON "guide_payouts"("guideId");
CREATE INDEX "guide_payouts_status_idx" ON "guide_payouts"("status");
CREATE INDEX "guide_payouts_providerReference_idx" ON "guide_payouts"("providerReference");
CREATE INDEX "guide_payouts_requestedAt_idx" ON "guide_payouts"("requestedAt");

-- Indexes financial_ledger
CREATE UNIQUE INDEX "financial_ledger_referenceNumber_key" ON "financial_ledger"("referenceNumber");
CREATE INDEX "financial_ledger_ledgerType_idx" ON "financial_ledger"("ledgerType");
CREATE INDEX "financial_ledger_bookingId_idx" ON "financial_ledger"("bookingId");
CREATE INDEX "financial_ledger_paymentId_idx" ON "financial_ledger"("paymentId");
CREATE INDEX "financial_ledger_payoutId_idx" ON "financial_ledger"("payoutId");
CREATE INDEX "financial_ledger_userId_idx" ON "financial_ledger"("userId");
CREATE INDEX "financial_ledger_status_idx" ON "financial_ledger"("status");
CREATE INDEX "financial_ledger_createdAt_idx" ON "financial_ledger"("createdAt");

-- Indexes receipts
CREATE UNIQUE INDEX "receipts_receiptNumber_key" ON "receipts"("receiptNumber");
CREATE UNIQUE INDEX "receipts_invoiceNumber_key" ON "receipts"("invoiceNumber");
CREATE UNIQUE INDEX "receipts_verificationToken_key" ON "receipts"("verificationToken");
CREATE UNIQUE INDEX "receipts_voyagexReference_key" ON "receipts"("voyagexReference");
CREATE INDEX "receipts_bookingId_idx" ON "receipts"("bookingId");
CREATE INDEX "receipts_paymentId_idx" ON "receipts"("paymentId");
CREATE INDEX "receipts_payoutId_idx" ON "receipts"("payoutId");
CREATE INDEX "receipts_receiptType_idx" ON "receipts"("receiptType");
CREATE INDEX "receipts_providerReference_idx" ON "receipts"("providerReference");

-- Foreign keys
ALTER TABLE "guide_payout_accounts" ADD CONSTRAINT "guide_payout_accounts_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "guide_payouts" ADD CONSTRAINT "guide_payouts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guide_payouts" ADD CONSTRAINT "guide_payouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guide_payouts" ADD CONSTRAINT "guide_payouts_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "guide_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "guide_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
