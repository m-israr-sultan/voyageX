import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PayoutWebhookService } from '../financial/services/payout-webhook.service';
import { SubscriptionWebhookService } from '../financial/services/subscription-webhook.service';
import { RefundOrchestrationService } from '../financial/services/refund-orchestration.service';

@Controller()
export class FinancialWebhooksController {
  constructor(
    private readonly payoutWebhooks: PayoutWebhookService,
    private readonly subscriptionWebhooks: SubscriptionWebhookService,
    private readonly refunds: RefundOrchestrationService,
  ) {}

  @Post('payouts/webhook/:provider')
  @Public()
  handlePayoutWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    return this.payoutWebhooks.handle(provider, headers, body);
  }

  @Post('subscriptions/webhook/:provider')
  @Public()
  handleSubscriptionWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    return this.subscriptionWebhooks.handle(provider, headers, body);
  }

  @Post('refunds/webhook/:provider')
  @Public()
  async handleRefundWebhook(
    @Param('provider') provider: string,
    @Body() body: { refundReference?: string; providerRefundId?: string; status?: string },
  ) {
    const ref = body.refundReference ?? body.providerRefundId;
    if (!ref || !body.status) return { received: true };
    await this.refunds.handleRefundWebhook(ref, body.status);
    return { received: true };
  }
}
