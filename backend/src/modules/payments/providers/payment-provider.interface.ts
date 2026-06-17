/**
 * Common interface every payment provider must implement.
 * Sandbox implementations are complete and correct.
 * Only real gateway credentials are missing for production —
 * zero business logic changes required at go-live.
 */

export interface InitiatePaymentParams {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  /** VoyageX-generated local reference (e.g. VX-20260614-XXXX) */
  reference: string;
  /** EasyPaisa / JazzCash only */
  mobileNumber?: string;
  /** Card only — gateway token, never raw card data */
  cardToken?: string;
  /** Bank Transfer only */
  bankReference?: string;
  /** Bank Transfer only — URL of uploaded proof screenshot */
  proofUrl?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  /**
   * Reference issued by the payment gateway.
   * EasyPaisa: Order ID  |  JazzCash: PP_TxnRefNo
   * Card: PaymentIntent ID  |  Bank Transfer: local reference
   * Stored in payments.providerTransactionId.
   */
  providerTransactionId: string;
  /** Human-readable gateway reference displayed in receipts */
  providerReference: string;
  /**
   * URL to redirect the traveler to (e.g. gateway-hosted page).
   * Present for redirect-based flows (HBL PayConnect, etc.).
   * Undefined for API-based flows (EasyPaisa, JazzCash mobile).
   */
  redirectUrl?: string;
  message: string;
}

export interface RefundParams {
  providerTransactionId: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundReference: string;
}

export interface WebhookResult {
  success: boolean;
  providerTransactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
}

export interface IPaymentProvider {
  /**
   * Initiate a payment.
   * Sandbox: generates a fake reference and logs what would be sent.
   * Production: calls the gateway API.
   */
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;

  /**
   * Verify that an incoming webhook was actually sent by this gateway.
   * Sandbox: always returns true.
   * Production: validates HMAC signature from gateway.
   */
  verifyWebhook(headers: Record<string, string>, body: unknown): boolean;

  /**
   * Parse a verified webhook body and extract standardised fields.
   */
  processWebhook(body: unknown): Promise<WebhookResult>;

  /**
   * Initiate a refund via the gateway.
   * Sandbox: creates a reference, logs action.
   * Production: calls the gateway refund API.
   */
  initiateRefund(params: RefundParams): Promise<RefundResult>;

  /**
   * Poll the gateway for the current status of a transaction.
   * Sandbox: always returns PENDING.
   * Production: calls the gateway status-check API.
   */
  getTransactionStatus(providerTransactionId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    amount: number;
  }>;
}
