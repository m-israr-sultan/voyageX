import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
    this.logger.log(`OTP email queued to ${email} for ${purpose}: ${otp}`);
  }
}
