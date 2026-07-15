-- Add SUPERSEDED to VerificationStatus enum.
-- Root cause: verifications.controller.ts set status: 'SUPERSEDED' via an unsafe
-- TypeScript cast, but the Prisma-generated enum only had PENDING/APPROVED/REJECTED,
-- causing PrismaClientValidationError at runtime. This migration makes SUPERSEDED
-- a real DB enum value so the "old rejected doc -> SUPERSEDED on re-upload" workflow
-- persists correctly.
-- Apply with: npx prisma migrate deploy  (or npx prisma db push when DB is online)

ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'SUPERSEDED';
