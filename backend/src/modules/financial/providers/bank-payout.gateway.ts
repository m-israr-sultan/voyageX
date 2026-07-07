import { Injectable, Logger } from '@nestjs/common';
import { PayoutProvider } from '@prisma/client';
import {
  InitiatePayoutParams,
  InitiatePayoutResult,
  IPayoutGateway,
  PayoutStatusResult,
} from './payout-gateway.interface';

/**
 * Bank Transfer Payout Gateway — Sandbox Foundation
 *
 * Manual bank disbursement workflow.
 * Admin confirms transfer; no external API required at go-live.
 */
@Injectable()
export class BankPayoutGateway implements IPayoutGateway {
  readonly provider = PayoutProvider.BANK;
  private readonly logger = new Logger(BankPayoutGateway.name);

  async initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult> {
    const providerReference = `BANK-PAYOUT-SBX-${Date.now()}`;
    this.logger.log(
      `[SANDBOX] Bank payout would be sent: ref=${params.voyagexReference} amount=${params.amount} iban=${params.iban ?? 'n/a'}`,
    );
    return {
      success: true,
      providerReference,
      message: 'Sandbox bank payout queued for manual processing',
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
