/*
 * JazzCash Provider — Sandbox Implementation
 *
 * TO GO LIVE, replace sandbox logic with real API calls:
 *
 * API Endpoint:  https://sandbox.jazzcash.com.pk/ApplicationAPI/API/
 *   Production:  https://jazzcash.com.pk/ApplicationAPI/API/
 * Required credentials (from JazzCash merchant portal):
 *   JAZZCASH_MERCHANT_ID      — Merchant ID
 *   JAZZCASH_PASSWORD         — Merchant password
 *   JAZZCASH_INTEGRITY_SALT   — Salt for HMAC-SHA256 signature
 *
 * Signature algorithm:  HMAC-SHA256 of sorted params separated by &, + integrity salt
 * Webhook URL to register in merchant portal:
 *   https://yourdomain.com/api/v1/payments/webhook/jazzcash
 * Test portal: sandbox.jazzcash.com.pk
 *
 * Go-live checklist:
 *   □ Register at jazzcash.com.pk
 *   □ Obtain Merchant ID, Password, Integrity Salt
 *   □ Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT in .env
 *   □ Register webhook URL in merchant portal
 *   □ Replace sandbox verifyWebhook() with HMAC-SHA256 validation
 *   □ Replace sandbox initiatePayment() with real Mobile Account API call
 *   □ Test end-to-end with JazzCash sandbox credentials
 *   □ Switch to production endpoint and credentials
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
export class JazzcashProvider implements IPaymentProvider {
  private readonly logger = new Logger(JazzcashProvider.name);

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const sandboxId = `JC-SANDBOX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    this.logger.log(
      `[SANDBOX] JazzCash initiatePayment | booking=${params.bookingId} ` +
      `amount=${params.amount} PKR | mobile=${params.mobileNumber} | ref=${params.reference}`,
    );
    this.logger.log(
      `[SANDBOX] In production this would call JazzCash Mobile Account API with ` +
      `HMAC-SHA256 signed PP_* parameters.`,
    );

    return {
      success: true,
      providerTransactionId: sandboxId,
      providerReference: sandboxId,
      message: `JazzCash sandbox payment initiated. PP_TxnRefNo: ${sandboxId}`,
    };
  }

  verifyWebhook(headers: Record<string, string>, _body: unknown): boolean {
    this.logger.log('[SANDBOX] JazzCash verifyWebhook — always true in sandbox');
    // TODO (production): validate HMAC-SHA256 of PP_ params with integrity salt
    //   const ppSecureHash = (body as any).pp_SecureHash;
    //   const params = Object.keys(body as object)
    //     .filter(k => k !== 'pp_SecureHash' && k.startsWith('pp_'))
    //     .sort()
    //     .map(k => (body as any)[k])
    //     .join('&');
    //   const expectedHash = createHmac('sha256', process.env.JAZZCASH_INTEGRITY_SALT)
    //     .update(params)
    //     .digest('hex')
    //     .toUpperCase();
    //   return ppSecureHash === expectedHash;
    return true;
  }

  async processWebhook(body: unknown): Promise<WebhookResult> {
    const wb = body as Record<string, unknown>;
    const providerTransactionId = String(wb['pp_TxnRefNo'] ?? wb['transactionId'] ?? '');
    const statusRaw = String(wb['pp_ResponseCode'] ?? wb['status'] ?? '').toUpperCase();
    const amount = Number(wb['pp_Amount'] ?? 0) / 100; // JazzCash sends amount in paisa

    // JazzCash response codes: 000 = success
    const isSuccess = statusRaw === '000' || statusRaw === 'SUCCESS';
    const isFailed = statusRaw !== '000' && statusRaw !== '' && statusRaw !== 'PENDING';

    return {
      success: isSuccess,
      providerTransactionId,
      status: isSuccess ? 'SUCCESS' : isFailed ? 'FAILED' : 'PENDING',
      amount,
    };
  }

  async initiateRefund(params: RefundParams): Promise<RefundResult> {
    const refundRef = `JC-REFUND-SANDBOX-${Date.now()}`;
    this.logger.log(
      `[SANDBOX] JazzCash initiateRefund | txn=${params.providerTransactionId} ` +
      `amount=${params.amount} | ref=${refundRef}`,
    );
    // TODO (production): call JazzCash refund API
    //   POST https://jazzcash.com.pk/ApplicationAPI/API/Refund/...
    return { success: true, refundReference: refundRef };
  }

  async getTransactionStatus(providerTransactionId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    amount: number;
  }> {
    this.logger.log(`[SANDBOX] JazzCash getTransactionStatus | txn=${providerTransactionId}`);
    // TODO (production): call JazzCash Inquiry API
    return { status: 'PENDING', amount: 0 };
  }
}
