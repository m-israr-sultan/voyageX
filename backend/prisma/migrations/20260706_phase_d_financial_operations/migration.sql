-- Phase D: financial operations, reconciliation, settings, provider statements, refund/webhook extensions

ALTER TYPE "RefundStatus" ADD VALUE IF NOT EXISTS 'REQUESTED';
ALTER TYPE "RefundStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "RefundStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TYPE "WebhookEventType" ADD VALUE IF NOT EXISTS 'REFUND';

CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'VERIFIED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REPLAYED');
CREATE TYPE "ReconciliationPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL');
CREATE TYPE "ReconciliationReportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "ReconciliationIssueType" AS ENUM (
  'PAYMENT_WITHOUT_LEDGER', 'LEDGER_WITHOUT_RECEIPT', 'PAYOUT_PROVIDER_MISMATCH',
  'PROVIDER_SUCCESS_NO_RECEIPT', 'DUPLICATE_LEDGER', 'DUPLICATE_RECEIPT',
  'DUPLICATE_PAYOUT', 'STATEMENT_MISMATCH', 'WEBHOOK_UNPROCESSED', 'REFUND_WITHOUT_LEDGER'
);
CREATE TYPE "ReconciliationIssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ProviderStatementStatus" AS ENUM ('IMPORTED', 'PROCESSING', 'RECONCILED', 'FAILED');
CREATE TYPE "ProviderStatementSource" AS ENUM ('CSV', 'EXCEL', 'API', 'MANUAL');

ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "requestedById" TEXT;
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT;
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "refunds_idempotencyKey_key" ON "refunds"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "refunds_status_idx" ON "refunds"("status");
CREATE INDEX IF NOT EXISTS "refunds_paymentId_idx" ON "refunds"("paymentId");
CREATE INDEX IF NOT EXISTS "refunds_bookingId_idx" ON "refunds"("bookingId");

ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "processingStatus" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED';
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "processingTimeMs" INTEGER;
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "lastRetryAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "webhook_events_processingStatus_idx" ON "webhook_events"("processingStatus");
CREATE INDEX IF NOT EXISTS "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");

CREATE TABLE IF NOT EXISTS "financial_settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "valueType" TEXT NOT NULL DEFAULT 'STRING',
  "label" TEXT,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general',
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "financial_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "financial_settings_key_key" ON "financial_settings"("key");
CREATE INDEX IF NOT EXISTS "financial_settings_category_idx" ON "financial_settings"("category");

CREATE TABLE IF NOT EXISTS "reconciliation_reports" (
  "id" TEXT NOT NULL,
  "period" "ReconciliationPeriod" NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" "ReconciliationReportStatus" NOT NULL DEFAULT 'PENDING',
  "triggeredBy" TEXT NOT NULL,
  "issueCount" INTEGER NOT NULL DEFAULT 0,
  "resolvedCount" INTEGER NOT NULL DEFAULT 0,
  "summary" JSONB,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reconciliation_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reconciliation_reports_period_idx" ON "reconciliation_reports"("period");
CREATE INDEX IF NOT EXISTS "reconciliation_reports_status_idx" ON "reconciliation_reports"("status");
CREATE INDEX IF NOT EXISTS "reconciliation_reports_periodStart_periodEnd_idx" ON "reconciliation_reports"("periodStart", "periodEnd");

CREATE TABLE IF NOT EXISTS "reconciliation_issues" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "issueType" "ReconciliationIssueType" NOT NULL,
  "severity" "ReconciliationIssueSeverity" NOT NULL DEFAULT 'MEDIUM',
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reconciliation_issues_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reconciliation_issues_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reconciliation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "reconciliation_issues_reportId_idx" ON "reconciliation_issues"("reportId");
CREATE INDEX IF NOT EXISTS "reconciliation_issues_issueType_idx" ON "reconciliation_issues"("issueType");
CREATE INDEX IF NOT EXISTS "reconciliation_issues_resolved_idx" ON "reconciliation_issues"("resolved");

CREATE TABLE IF NOT EXISTS "provider_statements" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "statementType" TEXT NOT NULL,
  "source" "ProviderStatementSource" NOT NULL,
  "fileName" TEXT,
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3),
  "status" "ProviderStatementStatus" NOT NULL DEFAULT 'IMPORTED',
  "importedBy" TEXT,
  "totalRecords" INTEGER NOT NULL DEFAULT 0,
  "matchedRecords" INTEGER NOT NULL DEFAULT 0,
  "unmatchedRecords" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "provider_statements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "provider_statements_provider_idx" ON "provider_statements"("provider");
CREATE INDEX IF NOT EXISTS "provider_statements_status_idx" ON "provider_statements"("status");

CREATE TABLE IF NOT EXISTS "provider_statement_lines" (
  "id" TEXT NOT NULL,
  "statementId" TEXT NOT NULL,
  "providerReference" TEXT NOT NULL,
  "transactionDate" TIMESTAMP(3),
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "matchStatus" TEXT NOT NULL DEFAULT 'UNMATCHED',
  "matchedResourceType" TEXT,
  "matchedResourceId" TEXT,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_statement_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_statement_lines_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "provider_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "provider_statement_lines_statementId_idx" ON "provider_statement_lines"("statementId");
CREATE INDEX IF NOT EXISTS "provider_statement_lines_providerReference_idx" ON "provider_statement_lines"("providerReference");

CREATE TABLE IF NOT EXISTS "financial_accounting_snapshots" (
  "id" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "gmv" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "platformRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "guideEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "agencySubscriptionRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "refundTotals" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commissionRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vatAmount" DOUBLE PRECISION,
  "taxAmount" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_accounting_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "financial_accounting_snapshots_period_idx" ON "financial_accounting_snapshots"("periodStart", "periodEnd");
