/**
 * Financial email subjects for future phases.
 * All financial emails use MAIL_FROM from environment (VoyageX <noreply@voyagextravel.com>).
 * Do not hardcode sender addresses here.
 */
export const FINANCIAL_EMAIL_SUBJECTS = {
  PAYMENT_SUCCESS: 'Payment confirmed — VoyageX',
  ESCROW_CREATED: 'Your payment is held in escrow — VoyageX',
  ESCROW_RELEASED: 'Escrow released — VoyageX',
  GUIDE_PAYOUT: 'Payout processed — VoyageX',
  AGENCY_SUBSCRIPTION: 'Subscription payment received — VoyageX',
  REFUND: 'Refund processed — VoyageX',
  RECEIPT_GENERATED: 'Your receipt is ready — VoyageX',
} as const;
