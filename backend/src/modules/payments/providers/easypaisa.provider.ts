/*
 * EasyPaisa Provider — Sandbox Implementation
 *
 * TO GO LIVE, replace sandbox logic with real API calls:
 *
 * API Endpoint:  https://easypaisa.com.pk/tpg/
 * Required credentials (from EasyPaisa merchant portal):
 *   EASYPAISA_MERCHANT_ID  — Merchant ID issued at registration
 *   EASYPAISA_HASH_KEY     — Hash key for HMAC-SHA256 signatures
 *
 * Signature algorithm:  HMAC-SHA256 of sorted request params + hash key
 * Webhook URL to register in merchant portal:
 *   https://yourdomain.com/api/v1/payments/webhook/easypaisa
 * Test credentials: developer.easypaisa.com.pk
 *
 * Go-live checklist:
 *   □ Register merchant account at easypaisa.com.pk
 *   □ Obtain Merchant ID and Hash Key
 *   □ Set EASYPAISA_MERCHANT_ID and EASYPAISA_HASH_KEY in .env
 *   □ Register webhook URL in merchant portal
 *   □ Replace sandbox verifyWebhook() with HMAC-SHA256 validation
 *   □ Replace sandbox initiatePayment() with real OTC API call
 *   □ Test end-to-end with EasyPaisa sandbox credentials
 *   □ Switch to production credentials
 */
import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentProvider,
  InitiatePaymentParams,
  InitiatePaymentResult,
  RefundParams,
  RefundResult,
  WebhookResult,
} from './payment-provider.interface';

@Injectable()
export class EasypaisaProvider implements IPaymentProvider {
  private readonly logger = new Logger(EasypaisaProvider.name);

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const sandboxId = `EP-SANDBOX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    this.logger.log(
      `[SANDBOX] EasyPaisa initiatePayment | booking=${params.bookingId} ` +
      `amount=${params.amount} PKR | mobile=${params.mobileNumber} | ref=${params.reference}`,
    );
    this.logger.log(
      `[SANDBOX] In production this would call EasyPaisa OTC API with ` +
      `EASYPAISA_MERCHANT_ID and HMAC-SHA256 signed request.`,
    );

    return {
      success: true,
      providerTransactionId: sandboxId,
      providerReference: sandboxId,
      message: `EasyPaisa sandbox payment initiated. Reference: ${sandboxId}`,
    };
  }

  verifyWebhook(headers: Record<string, string>, _body: unknown): boolean {
    this.logger.log('[SANDBOX] EasyPaisa verifyWebhook — always true in sandbox');
    // TODO (production): validate HMAC-SHA256 signature
    //   const hash = headers['x-easypaisa-hash'];
    //   const expectedHash = createHmac('sha256', process.env.EASYPAISA_HASH_KEY)
    //     .update(JSON.stringify(body))
    //     .digest('hex');
    //   return hash === expectedHash;
    return true;
  }

  async processWebhook(body: unknown): Promise<WebhookResult> {
    const wb = body as Record<string, unknown>;
    const providerTransactionId = String(wb['orderId'] ?? wb['transactionId'] ?? '');
    const statusRaw = String(wb['status'] ?? wb['paymentStatus'] ?? '').toUpperCase();
    const amount = Number(wb['amount'] ?? 0);

    const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PENDING'> = {
      SUCCESS: 'SUCCESS',
      PAID: 'SUCCESS',
      FAILURE: 'FAILED',
      FAILED: 'FAILED',
      PENDING: 'PENDING',
    };

    return {
      success: statusMap[statusRaw] === 'SUCCESS',
      providerTransactionId,
      status: statusMap[statusRaw] ?? 'PENDING',
      amount,
    };
  }

  async initiateRefund(params: RefundParams): Promise<RefundResult> {
    const refundRef = `EP-REFUND-SANDBOX-${Date.now()}`;
    this.logger.log(
      `[SANDBOX] EasyPaisa initiateRefund | txn=${params.providerTransactionId} ` +
      `amount=${params.amount} | ref=${refundRef}`,
    );
    // TODO (production): call EasyPaisa refund API endpoint
    //   POST https://easypaisa.com.pk/tpg/refund
    //   Body: { orderId: params.providerTransactionId, amount, merchantId, ... }
    return { success: true, refundReference: refundRef };
  }

  async getTransactionStatus(providerTransactionId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    amount: number;
  }> {
    this.logger.log(`[SANDBOX] EasyPaisa getTransactionStatus | txn=${providerTransactionId}`);
    // TODO (production): call EasyPaisa status-check endpoint
    return { status: 'PENDING', amount: 0 };
  }
}
