-- Add isFlagged / flagReason columns to messages.
-- Root cause: prisma/schema.prisma declares `isFlagged Boolean @default(false)` and
-- `flagReason String?` on the messages model (used by the contact-protection /
-- message-safety system in core.service.ts + message-safety.ts to detect and flag
-- messages containing phone numbers, emails, WhatsApp references, URLs, or social
-- links). The initial migration (20260530110319_init) created the messages table
-- WITHOUT these two columns, so `prisma generate` produced a client that assumes
-- they exist while the live database never got them. Any unscoped
-- `prisma.messages.findMany()` (e.g. conversationMessages, myConversations'
-- nested `messages` include) selects all scalar columns by default and throws
-- PrismaClientKnownRequestError: column messages.isFlagged does not exist.
-- This migration brings the database back in sync with the schema.
-- Apply with: npx prisma migrate deploy  (or npx prisma db push when DB is online)

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "isFlagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "flagReason" TEXT;
