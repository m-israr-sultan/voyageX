import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { AppConfigService } from '../../config/app-config.service';
import { buildOtpEmailContent } from '../../config/mail.templates';
import { parseMailFromDisplayName } from '../../config/mail.util';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly appConfig: AppConfigService,
  ) {
    if (!this.appConfig.isMailConfigured) {
      this.logger.warn(
        'SMTP mail is not fully configured. Set MAIL_HOST, MAIL_USER, MAIL_PASS, and MAIL_FROM to send emails.',
      );
    }
  }

  async sendOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
    if (!this.appConfig.isMailConfigured) {
      if (!this.appConfig.isProduction) {
        this.logger.warn(
          `[DEV] OTP email for ${purpose} to ${email} skipped (SMTP not configured)`,
        );
      }
      throw new ServiceUnavailableException(
        'Email service is temporarily unavailable. Please try again later.',
      );
    }

    const from = this.appConfig.mailFrom;
    const displayName = parseMailFromDisplayName(from);
    const { subject, html, text } = buildOtpEmailContent(otp, purpose, displayName);

    try {
      await this.mailer.sendMail({
        from,
        to: email,
        subject,
        html,
        text,
      });

      this.logger.log(`OTP email sent to ${email} for ${purpose} via SMTP`);
    } catch (error: unknown) {
      const smtpError = error as {
        code?: string;
        response?: string;
        message?: string;
      };

      this.logger.error(
        `SMTP send failed for ${purpose} to ${email}: code=${smtpError.code ?? 'unknown'} message=${smtpError.message ?? 'unknown'} response=${smtpError.response ?? 'none'}`,
      );

      throw new InternalServerErrorException(
        'Unable to send email at this time. Please try again later.',
      );
    }
  }
}
