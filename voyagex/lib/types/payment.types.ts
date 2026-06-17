/**
 * Frontend payment type definitions.
 * Must mirror the backend Prisma PaymentMethod and PaymentStatus enums exactly.
 * Developer typos are caught at compile time (tsc), not at runtime (400 from backend).
 */

/** Exactly four permitted payment methods — CASH, MANUAL, VOYAGEX are banned. */
export type PaymentMethodType =
  | 'EASYPAISA'
  | 'JAZZCASH'
  | 'CARD'
  | 'BANK_TRANSFER';

export type PaymentStatusType =
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'HELD'
  | 'CONFIRMED'
  | 'RELEASED'
  | 'PARTIALLY_RELEASED'
  | 'REFUNDED'
  | 'FAILED'
  | 'CANCELLED';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  EASYPAISA: 'EasyPaisa',
  JAZZCASH: 'JazzCash',
  CARD: 'Credit / Debit Card',
  BANK_TRANSFER: 'Bank Transfer',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusType, string> = {
  PENDING: 'Pending',
  PENDING_REVIEW: 'Under Review',
  HELD: 'Payment Held',
  CONFIRMED: 'Confirmed',
  RELEASED: 'Released',
  PARTIALLY_RELEASED: 'Partially Released',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};
