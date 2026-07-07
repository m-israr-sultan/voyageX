/**
 * Payment gateway abstraction.
 * IPaymentGateway is the canonical interface name for inbound traveler payments.
 * Existing provider implementations satisfy this contract via IPaymentProvider.
 */
export type {
  IPaymentProvider as IPaymentGateway,
  InitiatePaymentParams,
  InitiatePaymentResult,
  RefundParams,
  RefundResult,
  WebhookResult,
} from '../../payments/providers/payment-provider.interface';
