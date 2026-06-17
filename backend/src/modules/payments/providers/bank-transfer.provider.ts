/*
 * Bank Transfer Provider
 *
 * No external gateway required.
 * Workflow is admin-reviewed proof upload:
 *   1. Traveler transfers to VoyageX bank account
 *   2. Traveler uploads screenshot as proof
 *   3. Admin reviews proof image in admin panel
 *   4. Admin approves → payment CONFIRMED, booking proceeds
 *   5. Admin rejects → traveler notified with reason
 *
 * Same workflow applies to:
 *   - Domestic traveler bookings
 *   - International bookings (BANK_TRANSFER method)
 *   - Agency subscription payments (BANK_TRANSFER method)
 *
 * VoyageX Bank Details (update these before go-live):
 *   Bank:           Meezan Bank
 *   Account Name:   VoyageX Pvt Ltd
 *   Account Number: [ADD REAL ACCOUNT NUMBER]
 *   IBAN:           [ADD REAL IBAN]
 *
 * Go-live checklist:
 *   □ Update BANK_DETAILS below with real account information
 *   □ Workflow is complete — admin approval is the only gate
 *   □ No gateway integration needed
 *   □ Ready for production as-is after IBAN update
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

/** Update with real VoyageX bank account before go-live. */
export const VOYAGEX_BANK_DETAILS = {
  bankName: 'Meezan Bank',
  accountName: 'VoyageX Pvt Ltd',
  accountNumber: '[ADD REAL ACCOUNT NUMBER]',
  iban: '[ADD REAL IBAN]',
};

@Injectable()
export class BankTransferProvider implements IPaymentProvider {
  private readonly logger = new Logger(BankTransferProvider.name);

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    // Bank Transfer does not require a real-time gateway API call.
    // A PENDING_REVIEW payment record is created; admin approves after
    // verifying the proof uploaded by the traveler.
    const localRef = params.reference;

    this.logger.log(
      `[BANK_TRANSFER] initiatePayment | booking=${params.bookingId} ` +
      `amount=${params.amount} PKR | proof=${params.proofUrl ?? 'none'} | ref=${localRef}`,
    );

    if (!params.proofUrl) {
      this.logger.warn(
        `[BANK_TRANSFER] No proof URL submitted for booking=${params.bookingId}. ` +
        `Admin will need to manually request proof from traveler.`,
      );
    }

    return {
      success: true,
      // Bank Transfer has no gateway provider ID — use local reference
      providerTransactionId: params.bankReference ?? localRef,
      providerReference: localRef,
      message: `Bank transfer submitted for admin review. ` +
               `Please wait up to 24 hours for verification.`,
    };
  }

  verifyWebhook(_headers: Record<string, string>, _body: unknown): boolean {
    // Bank Transfer has no external webhook — admin manually approves.
    // This method should not be called for BANK_TRANSFER.
    this.logger.warn('[BANK_TRANSFER] verifyWebhook called — bank transfer has no webhook');
    return false;
  }

  async processWebhook(_body: unknown): Promise<WebhookResult> {
    // Bank Transfer has no external webhook.
    return {
      success: false,
      providerTransactionId: '',
      status: 'PENDING',
      amount: 0,
    };
  }

  async initiateRefund(params: RefundParams): Promise<RefundResult> {
    const refundRef = `BT-REFUND-${Date.now()}`;
    this.logger.log(
      `[BANK_TRANSFER] initiateRefund | ref=${params.providerTransactionId} ` +
      `amount=${params.amount} PKR | reason=${params.reason}`,
    );
    // Bank Transfer refunds are manual: admin transfers money back to traveler
    // and marks the refund as PROCESSED in the admin panel.
    this.logger.log(
      `[BANK_TRANSFER] Manual refund required: admin must transfer ` +
      `Rs ${params.amount} to traveler's bank account.`,
    );
    return { success: true, refundReference: refundRef };
  }

  async getTransactionStatus(providerTransactionId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    amount: number;
  }> {
    this.logger.log(`[BANK_TRANSFER] getTransactionStatus | txn=${providerTransactionId}`);
    // Status is determined by admin approval, not gateway polling.
    return { status: 'PENDING', amount: 0 };
  }
}
