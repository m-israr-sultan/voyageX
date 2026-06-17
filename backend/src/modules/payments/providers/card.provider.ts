/*
 * Card Provider — Sandbox Implementation
 *
 * CRITICAL — PCI DSS REQUIREMENT:
 *   Raw card data (PAN, CVV, expiry) must NEVER reach VoyageX servers.
 *   This provider accepts only a gateway-issued TOKEN, not card numbers.
 *   The token is generated on the client side by the gateway's SDK.
 *
 * TO GO LIVE, choose one gateway and implement:
 *
 * Option 1 — Stripe (recommended for international cards + Pakistan):
 *   Frontend SDK:   npm install @stripe/stripe-js @stripe/react-stripe-js
 *   Backend SDK:    npm install stripe
 *   Required credentials:
 *     STRIPE_PUBLISHABLE_KEY   (frontend — exposed in browser)
 *     STRIPE_SECRET_KEY        (backend — never exposed)
 *     STRIPE_WEBHOOK_SECRET    (for webhook signature verification)
 *   Flow:
 *     1. Frontend: render <CardElement> from @stripe/react-stripe-js
 *     2. Frontend: stripe.createPaymentMethod({ type: 'card', card }) → token
 *     3. Frontend: send token to VoyageX backend as cardToken
 *     4. Backend:  stripe.paymentIntents.create({ amount, currency, payment_method: token })
 *     5. Backend:  confirm PaymentIntent, receive providerTransactionId
 *   Webhook URL: https://yourdomain.com/api/v1/payments/webhook/card
 *
 * Option 2 — HBL PayConnect:
 *   Contact: hblpayconnect.com
 *   Uses hosted payment page redirect — traveler redirected to HBL
 *   HBL redirects back to VoyageX with transaction result
 *   Card data never touches VoyageX systems
 *
 * Option 3 — 1Link:
 *   Contact: 1link.net.pk
 *   Hosted fields SDK similar to Stripe
 *
 * Go-live checklist (Stripe path):
 *   □ Create Stripe account, enable Pakistan billing
 *   □ Install stripe and @stripe/react-stripe-js packages
 *   □ Set STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET in .env
 *   □ Replace sandbox CardElement with <CardElement> from Stripe React SDK
 *   □ Remove sandbox cardToken input from PaymentModal
 *   □ Replace sandbox initiatePayment() with stripe.paymentIntents.create()
 *   □ Replace sandbox verifyWebhook() with stripe.webhooks.constructEvent()
 *   □ Register webhook URL in Stripe dashboard
 *   □ Test with Stripe test cards (4242 4242 4242 4242)
 *   □ Switch to live keys
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
export class CardProvider implements IPaymentProvider {
  private readonly logger = new Logger(CardProvider.name);

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const sandboxId = `CARD-SANDBOX-PI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    this.logger.log(
      `[SANDBOX] Card initiatePayment | booking=${params.bookingId} ` +
      `amount=${params.amount} PKR | tokenPresent=${!!params.cardToken}`,
    );
    this.logger.log(
      `[SANDBOX] In production this would call Stripe/HBL/1Link with the card token.`,
    );

    return {
      success: true,
      providerTransactionId: sandboxId,
      providerReference: sandboxId,
      message: `Card sandbox payment initiated. PaymentIntent: ${sandboxId}`,
    };
  }

  verifyWebhook(headers: Record<string, string>, _body: unknown): boolean {
    this.logger.log('[SANDBOX] Card verifyWebhook — always true in sandbox');
    // TODO (production — Stripe path):
    //   const sig = headers['stripe-signature'];
    //   try {
    //     stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    //     return true;
    //   } catch {
    //     return false;
    //   }
    return true;
  }

  async processWebhook(body: unknown): Promise<WebhookResult> {
    const wb = body as Record<string, unknown>;
    // Stripe webhook shape: { type: 'payment_intent.succeeded', data: { object: { id, amount_received } } }
    const type = String(wb['type'] ?? '');
    const dataObj = (wb['data'] as Record<string, unknown>)?.['object'] as Record<string, unknown> ?? {};
    const providerTransactionId = String(dataObj['id'] ?? wb['transactionId'] ?? '');
    const amount = Number(dataObj['amount_received'] ?? dataObj['amount'] ?? 0) / 100;

    const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PENDING'> = {
      'payment_intent.succeeded': 'SUCCESS',
      'payment_intent.payment_failed': 'FAILED',
      'payment_intent.created': 'PENDING',
    };

    return {
      success: type === 'payment_intent.succeeded',
      providerTransactionId,
      status: statusMap[type] ?? 'PENDING',
      amount,
    };
  }

  async initiateRefund(params: RefundParams): Promise<RefundResult> {
    const refundRef = `CARD-REFUND-SANDBOX-${Date.now()}`;
    this.logger.log(
      `[SANDBOX] Card initiateRefund | txn=${params.providerTransactionId} ` +
      `amount=${params.amount} | ref=${refundRef}`,
    );
    // TODO (production — Stripe path):
    //   const refund = await stripe.refunds.create({
    //     payment_intent: params.providerTransactionId,
    //     amount: Math.round(params.amount * 100),
    //     reason: 'requested_by_customer',
    //   });
    //   return { success: refund.status === 'succeeded', refundReference: refund.id };
    return { success: true, refundReference: refundRef };
  }

  async getTransactionStatus(providerTransactionId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    amount: number;
  }> {
    this.logger.log(`[SANDBOX] Card getTransactionStatus | txn=${providerTransactionId}`);
    // TODO (production — Stripe path):
    //   const pi = await stripe.paymentIntents.retrieve(providerTransactionId);
    //   const status = pi.status === 'succeeded' ? 'SUCCESS' :
    //                  pi.status === 'canceled' ? 'FAILED' : 'PENDING';
    //   return { status, amount: pi.amount / 100 };
    return { status: 'PENDING', amount: 0 };
  }
}
