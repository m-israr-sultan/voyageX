import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentMethod, UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { AuditService } from '../../common/services/audit.service';
import { InitiatePaymentDto } from '../dto/payment-initiation.dto';
import { PaymentProviderFactory } from '../payments/providers/payment-provider.factory';
import { CoreService } from '../services/core.service';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

class RefundBodyDto {
  @IsNumber() @Min(1) amount!: number;
  @IsString() @IsNotEmpty() reason!: string;
}

class RejectProofBodyDto {
  @IsString() @IsNotEmpty() reason!: string;
}

/**
 * Maps URL provider slug to PaymentMethod enum.
 * Sandbox: all webhooks are accepted. Production: each requires signature validation.
 */
function mapProviderToMethod(provider: string): PaymentMethod | null {
  const map: Record<string, PaymentMethod> = {
    easypaisa: PaymentMethod.EASYPAISA,
    jazzcash: PaymentMethod.JAZZCASH,
    card: PaymentMethod.CARD,
    'bank-transfer': PaymentMethod.BANK_TRANSFER,
  };
  return map[provider.toLowerCase()] ?? null;
}

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly core: CoreService,
    private readonly factory: PaymentProviderFactory,
    private readonly audit: AuditService,
  ) {}

  // ============================================================
  // TRAVELER — Initiate payment
  // ============================================================

  @Post('initiate')
  initiate(@CurrentUser() user: AuthUser, @Body() body: InitiatePaymentDto) {
    return this.core.initiatePayment(user.id, body);
  }

  // ============================================================
  // ADMIN — Payment management
  // ============================================================

  @Patch(':id/release')
  @Roles(UserRole.ADMIN)
  release(@Param('id') id: string) {
    return this.core.releasePayment(id);
  }

  /**
   * Admin: approve a BANK_TRANSFER payment proof.
   * Transitions: payment PENDING_REVIEW → HELD, booking PENDING → CONFIRMED.
   */
  @Patch(':id/approve-proof')
  @Roles(UserRole.ADMIN)
  approveProof(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.core.approvePaymentProof(id, admin.id);
  }

  /**
   * Admin: reject a BANK_TRANSFER payment proof.
   * Transitions: payment PENDING_REVIEW → FAILED.
   * Traveler is notified with the rejection reason.
   */
  @Patch(':id/reject-proof')
  @Roles(UserRole.ADMIN)
  rejectProof(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() body: RejectProofBodyDto,
  ) {
    return this.core.rejectPaymentProof(id, admin.id, body.reason);
  }

  /**
   * Admin: initiate a refund for a payment.
   * Sandbox: creates a PENDING refund record.
   * Production: calls provider.initiateRefund(providerTransactionId, amount).
   */
  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  refund(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() body: RefundBodyDto,
  ) {
    return this.core.createRefund(id, admin.id, body.amount, body.reason);
  }

  /**
   * Admin: Force-confirm a SANDBOX payment for testing.
   * Moves payment status HELD → CONFIRMED.
   *
   * ⚠ SANDBOX TESTING ONLY ⚠
   * In production, payment confirmation comes from the gateway webhook.
   * This endpoint should be removed or gated behind SANDBOX_MODE=true before go-live.
   */
  @Patch(':id/sandbox-confirm')
  @Roles(UserRole.ADMIN)
  sandboxConfirm(@Param('id') id: string) {
    return this.core.sandboxConfirmPayment(id);
  }

  // ============================================================
  // WEBHOOK — Payment gateway callbacks
  //
  // EasyPaisa production requirements:
  //   Merchant ID from EasyPaisa developer portal
  //   Hash key for HMAC-SHA256 signature verification
  //   Webhook URL: https://yourdomain.com/api/v1/payments/webhook/easypaisa
  //   Signature algorithm: HMAC-SHA256 of request params + hash key
  //
  // JazzCash production requirements:
  //   Merchant ID, Password, Integrity Salt
  //   Webhook URL: https://yourdomain.com/api/v1/payments/webhook/jazzcash
  //   Signature algorithm: HMAC-SHA256 of sorted PP_ params + integrity salt
  //
  // Card production requirements:
  //   Choose gateway: Stripe, HBL PayConnect, or 1Link
  //   Stripe: STRIPE_WEBHOOK_SECRET for stripe.webhooks.constructEvent()
  //   Webhook URL: https://yourdomain.com/api/v1/payments/webhook/card
  // ============================================================

  @Post('webhook/:provider')
  @Public()
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ): Promise<{ received: boolean }> {
    const method = mapProviderToMethod(provider);
    if (!method) {
      this.logger.warn(`Unknown webhook provider: ${provider}`);
      // Return 200 to prevent retries for unknown providers
      return { received: true };
    }

    // Step 1: Verify webhook authenticity
    // Sandbox: verifyWebhook() always returns true.
    // Production: validates HMAC signature specific to each gateway.
    const providerService = this.factory.getProvider(method);
    const isValid = providerService.verifyWebhook(headers, body);
    if (!isValid) {
      this.logger.warn(`Invalid webhook signature from provider: ${provider}`);
      this.audit.log({
        action: 'payment.webhook_signature_failed',
        actorId: 'SYSTEM',
        resourceType: 'webhook',
        resourceId: provider,
        metadata: { provider, headers: Object.keys(headers) },
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Step 2: Return 200 immediately — gateways retry if ACK is slow
    // Process asynchronously to avoid timeout
    this.processWebhookAsync(method, body, provider).catch((err) =>
      this.logger.error(`Webhook processing failed for ${provider}: ${err.message}`, err.stack),
    );

    return { received: true };
  }

  private async processWebhookAsync(
    method: PaymentMethod,
    body: unknown,
    provider: string,
  ): Promise<void> {
    try {
      const providerService = this.factory.getProvider(method);
      const result = await providerService.processWebhook(body);

      this.logger.log(
        `Webhook received | provider=${provider} | txn=${result.providerTransactionId} | status=${result.status}`,
      );

      if (!result.providerTransactionId) {
        this.logger.warn(`Webhook from ${provider} missing providerTransactionId`);
        return;
      }

      // Find payment by providerTransactionId
      const payment = await this.core.findPaymentByProviderTxnId(
        result.providerTransactionId,
      );

      if (!payment) {
        this.logger.warn(
          `No payment found for providerTransactionId=${result.providerTransactionId}`,
        );
        return;
      }

      if (result.status === 'SUCCESS') {
        await this.core.webhookConfirmPayment(payment.id, result.providerTransactionId);
      } else if (result.status === 'FAILED') {
        await this.core.webhookFailPayment(payment.id);
      }
      // PENDING: log and wait for next webhook
    } catch (err) {
      this.logger.error(`processWebhookAsync error: ${(err as Error).message}`);
    }
  }
}
