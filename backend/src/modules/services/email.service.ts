import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { buildOtpEmailContent } from '../../config/mail.templates';
import { parseMailFromDisplayName } from '../../config/mail.util';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(
    private readonly appConfig: AppConfigService,
  ) {
    if (!this.appConfig.isMailConfigured) {
      this.logger.warn(
        'Mail is not fully configured. Set BREVO_API_KEY and MAIL_FROM to send emails.',
      );
    }
  }

  async sendOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
    if (!this.appConfig.isMailConfigured) {
      if (!this.appConfig.isProduction) {
        this.logger.warn(
          `[DEV] OTP email for ${purpose} to ${email} skipped (mail not configured)`,
        );
      }
      throw new ServiceUnavailableException(
        'Email service is temporarily unavailable. Please try again later.',
      );
    }

    const from = this.appConfig.mailFrom;
    const displayName = parseMailFromDisplayName(from);
    const { subject, html, text } = buildOtpEmailContent(otp, purpose, displayName);

    // Parse "VoyageX <noreply@voyagextravel.com>" into name + email
    const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
    const senderName = senderMatch ? senderMatch[1].trim() : displayName;
    const senderEmail = senderMatch ? senderMatch[2].trim() : from;

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email }],
      subject,
      htmlContent: html,
      textContent: text,
    };

    try {
      const response = await fetch(this.brevoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.appConfig.brevoApiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Brevo API error for ${purpose} to ${email}: status=${response.status} body=${errorBody}`,
        );
        throw new InternalServerErrorException(
          'Unable to send email at this time. Please try again later.',
        );
      }

      this.logger.log(`OTP email sent to ${email} for ${purpose} via Brevo API`);
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) throw error;
      if (error instanceof ServiceUnavailableException) throw error;

      const apiError = error as { message?: string };
      this.logger.error(
        `Brevo API call failed for ${purpose} to ${email}: ${apiError.message ?? 'unknown error'}`,
      );

      throw new InternalServerErrorException(
        'Unable to send email at this time. Please try again later.',
      );
    }
  }
}