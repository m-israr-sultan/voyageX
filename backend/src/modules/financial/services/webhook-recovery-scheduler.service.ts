import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WebhookOperationsService } from './webhook-operations.service';

@Injectable()
export class WebhookRecoverySchedulerService {
  private readonly logger = new Logger(WebhookRecoverySchedulerService.name);

  constructor(private readonly webhookOps: WebhookOperationsService) {}

  @Cron('0 */15 * * * *')
  async recoverFailedWebhooks(): Promise<void> {
    const recovered = await this.webhookOps.retryFailedEvents();
    if (recovered > 0) {
      this.logger.log(`Recovered ${recovered} failed webhook events`);
    }
  }
}
