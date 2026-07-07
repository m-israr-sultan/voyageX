import { PayoutProvider } from '@prisma/client';

export interface InitiatePayoutParams {
  payoutId: string;
  guideId: string;
  provider: PayoutProvider;
  amount: number;
  currency: string;
  /** VoyageX-generated payout reference (e.g. VX-PAYOUT-20260706-XXXX) */
  voyagexReference: string;
  /** Destination account details resolved from guide_payout_accounts */
  accountTitle: string;
  mobileNumber?: string;
  iban?: string;
  bankName?: string;
}

export interface InitiatePayoutResult {
  success: boolean;
  providerReference: string;
  message: string;
}

export interface PayoutStatusResult {
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  providerReference: string;
  amount: number;
}

/**
 * Outbound payout gateway abstraction.
 * Business logic must depend on this interface — never on EasyPaisa/JazzCash directly.
 * Sandbox implementations log actions; production swaps credentials only.
 */
export interface IPayoutGateway {
  readonly provider: PayoutProvider;

  initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult>;

  verifyWebhook(headers: Record<string, string>, body: unknown): boolean;

  processWebhook(body: unknown): Promise<{
    providerReference: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'CANCELLED';
    amount: number;
  }>;

  getPayoutStatus(providerReference: string): Promise<PayoutStatusResult>;
}
