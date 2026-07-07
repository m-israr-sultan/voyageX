import { Injectable, Logger } from '@nestjs/common';
import { PayoutProvider } from '@prisma/client';
import {
  InitiatePayoutParams,
  InitiatePayoutResult,
  IPayoutGateway,
  PayoutStatusResult,
} from './payout-gateway.interface';

/**
 * JazzCash Payout Gateway — Sandbox Foundation
 *
 * TO GO LIVE:
 * - JAZZCASH_PAYOUT_MERCHANT_ID
 * - JAZZCASH_PAYOUT_PASSWORD
 * - JAZZCASH_PAYOUT_INTEGRITY_SALT
 * - Register payout webhook URL
 */
@Injectable()
export class JazzcashPayoutGateway implements IPayoutGateway {
  readonly provider = PayoutProvider.JAZZCASH;
  private readonly logger = new Logger(JazzcashPayoutGateway.name);

  async initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult> {
    const providerReference = `JC-PAYOUT-SBX-${Date.now()}`;
    this.logger.log(
      `[SANDBOX] JazzCash payout would be sent: ref=${params.voyagexReference} amount=${params.amount} mobile=${params.mobileNumber ?? 'n/a'}`,
    );
    return {
      success: true,
      providerReference,
      message: 'Sandbox payout initiated',
    };
  }

  verifyWebhook(_headers: Record<string, string>, _body: unknown): boolean {
    return true;
  }

  async processWebhook(body: unknown): Promise<{
    providerReference: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'CANCELLED';
    amount: number;
  }> {
    const payload = body as { providerReference?: string; status?: string; amount?: number };
    const status = (payload.status ?? 'PENDING') as 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'CANCELLED';
    return {
      providerReference: payload.providerReference ?? '',
      status,
      amount: payload.amount ?? 0,
    };
  }

  async getPayoutStatus(providerReference: string): Promise<PayoutStatusResult> {
    return {
      status: 'PENDING',
      providerReference,
      amount: 0,
    };
  }
}
