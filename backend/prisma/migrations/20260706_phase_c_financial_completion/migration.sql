-- Phase C: webhook idempotency, receipt completion, ledger idempotency, subscription financial links

CREATE TYPE "ReceiptStatus" AS ENUM ('VALID', 'CANCELLED', 'REFUNDED');
CREATE TYPE "WebhookEventType" AS ENUM ('PAYMENT', 'PAYOUT', 'SUBSCRIPTION');

ALTER TABLE "financial_ledger" ADD COLUMN IF NOT EXISTS "subscriptionPaymentId" TEXT;
ALTER TABLE "financial_ledger" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "financial_ledger_idempotencyKey_key" ON "financial_ledger"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "financial_ledger_subscriptionPaymentId_idx" ON "financial_ledger"("subscriptionPaymentId");

ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "subscriptionPaymentId" TEXT;
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "status" "ReceiptStatus" NOT NULL DEFAULT 'VALID';
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "emailedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "receipts_subscriptionPaymentId_idx" ON "receipts"("subscriptionPaymentId");
CREATE INDEX IF NOT EXISTS "receipts_status_idx" ON "receipts"("status");

ALTER TABLE "financial_ledger"
  ADD CONSTRAINT "financial_ledger_subscriptionPaymentId_fkey"
  FOREIGN KEY ("subscriptionPaymentId") REFERENCES "agency_subscription_payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "receipts"
  ADD CONSTRAINT "receipts_subscriptionPaymentId_fkey"
  FOREIGN KEY ("subscriptionPaymentId") REFERENCES "agency_subscription_payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" TEXT NOT NULL,
  "eventType" "WebhookEventType" NOT NULL,
  "provider" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "payload" JSONB,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_eventType_provider_providerEventId_key"
  ON "webhook_events"("eventType", "provider", "providerEventId");
CREATE INDEX IF NOT EXISTS "webhook_events_eventType_idx" ON "webhook_events"("eventType");
CREATE INDEX IF NOT EXISTS "webhook_events_provider_idx" ON "webhook_events"("provider");
CREATE INDEX IF NOT EXISTS "webhook_events_processedAt_idx" ON "webhook_events"("processedAt");
