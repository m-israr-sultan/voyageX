import { Module } from '@nestjs/common';

// Email is now sent via Brevo HTTP API directly in EmailService.
// MailerModule (SMTP) is no longer used and has been removed.
@Module({})
export class MailModule {}