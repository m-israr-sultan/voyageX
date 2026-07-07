import { Injectable, Logger } from '@nestjs/common';
import { PayoutProvider } from '@prisma/client';
import {
  InitiatePayoutParams,
  InitiatePayoutResult,
  IPayoutGateway,
  PayoutStatusResult,
} from './payout-gateway.interface';

/**
 * EasyPaisa Payout Gateway — Sandbox Foundation
 *
 * TO GO LIVE:
 * - EASYPAISA_PAYOUT_MERCHANT_ID
 * - EASYPAISA_PAYOUT_HASH_KEY
 * - Register payout webhook URL
 * - Replace sandbox initiatePayout with real disbursement API
 */
@Injectable()
export class EasypaisaPayoutGateway implements IPayoutGateway {
  readonly provider = PayoutProvider.EASYPAISA;
  private readonly logger = new Logger(EasypaisaPayoutGateway.name);

  async initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult> {
    const providerReference = `EP-PAYOUT-SBX-${Date.now()}`;
    this.logger.log(
      `[SANDBOX] EasyPaisa payout would be sent: ref=${params.voyagexReference} amount=${params.amount} mobile=${params.mobileNumber ?? 'n/a'}`,
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
