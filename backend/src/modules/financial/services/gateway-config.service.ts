import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.validation';

export type GatewayCredentials = {
  merchantId: string;
  apiUrl: string;
  apiSecret: string;
  webhookSecret: string;
  hashKey?: string;
  integritySalt?: string;
};

@Injectable()
export class GatewayConfigService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  isSandbox(): boolean {
    const env = process.env.FINANCIAL_SANDBOX_MODE;
    if (env === 'false') return false;
    if (env === 'true') return true;
    return process.env.NODE_ENV !== 'production';
  }

  getEasypaisaPayment(): GatewayCredentials {
    return {
      merchantId: process.env.EASYPAISA_MERCHANT_ID ?? '',
      apiUrl: process.env.EASYPAISA_API_URL ?? 'https://easypaisa.com.pk/tpg/',
      apiSecret: process.env.EASYPAISA_API_SECRET ?? process.env.EASYPAISA_HASH_KEY ?? '',
      webhookSecret: process.env.EASYPAISA_WEBHOOK_SECRET ?? process.env.EASYPAISA_HASH_KEY ?? '',
      hashKey: process.env.EASYPAISA_HASH_KEY ?? '',
    };
  }

  getEasypaisaPayout(): GatewayCredentials {
    return {
      merchantId: process.env.EASYPAISA_PAYOUT_MERCHANT_ID ?? process.env.EASYPAISA_MERCHANT_ID ?? '',
      apiUrl: process.env.EASYPAISA_PAYOUT_API_URL ?? process.env.EASYPAISA_API_URL ?? '',
      apiSecret: process.env.EASYPAISA_PAYOUT_API_SECRET ?? process.env.EASYPAISA_HASH_KEY ?? '',
      webhookSecret: process.env.EASYPAISA_PAYOUT_WEBHOOK_SECRET ?? process.env.EASYPAISA_WEBHOOK_SECRET ?? '',
    };
  }

  getJazzcashPayment(): GatewayCredentials {
    return {
      merchantId: process.env.JAZZCASH_MERCHANT_ID ?? '',
      apiUrl: process.env.JAZZCASH_API_URL ?? '',
      apiSecret: process.env.JAZZCASH_API_SECRET ?? process.env.JAZZCASH_PASSWORD ?? '',
      webhookSecret: process.env.JAZZCASH_WEBHOOK_SECRET ?? process.env.JAZZCASH_INTEGRITY_SALT ?? '',
      integritySalt: process.env.JAZZCASH_INTEGRITY_SALT ?? '',
    };
  }

  getJazzcashPayout(): GatewayCredentials {
    return {
      merchantId: process.env.JAZZCASH_PAYOUT_MERCHANT_ID ?? process.env.JAZZCASH_MERCHANT_ID ?? '',
      apiUrl: process.env.JAZZCASH_PAYOUT_API_URL ?? process.env.JAZZCASH_API_URL ?? '',
      apiSecret: process.env.JAZZCASH_PAYOUT_API_SECRET ?? process.env.JAZZCASH_PASSWORD ?? '',
      webhookSecret: process.env.JAZZCASH_PAYOUT_WEBHOOK_SECRET ?? process.env.JAZZCASH_WEBHOOK_SECRET ?? '',
    };
  }

  getBankPayout(): GatewayCredentials {
    return {
      merchantId: process.env.BANK_PAYOUT_MERCHANT_ID ?? '',
      apiUrl: process.env.BANK_PAYOUT_API_URL ?? '',
      apiSecret: process.env.BANK_PAYOUT_API_SECRET ?? '',
      webhookSecret: process.env.BANK_PAYOUT_WEBHOOK_SECRET ?? '',
    };
  }

  getStripePayment(): GatewayCredentials {
    return {
      merchantId: process.env.STRIPE_MERCHANT_ID ?? '',
      apiUrl: process.env.STRIPE_API_URL ?? 'https://api.stripe.com',
      apiSecret: process.env.STRIPE_SECRET_KEY ?? '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    };
  }

  isProductionReady(provider: 'easypaisa' | 'jazzcash' | 'bank' | 'stripe'): boolean {
    if (this.isSandbox()) return true;
    const creds =
      provider === 'easypaisa'
        ? this.getEasypaisaPayment()
        : provider === 'jazzcash'
          ? this.getJazzcashPayment()
          : provider === 'bank'
            ? this.getBankPayout()
            : this.getStripePayment();
    return Boolean(creds.merchantId && creds.apiSecret && creds.webhookSecret);
  }

  getProviderHealth(): Array<{ provider: string; sandbox: boolean; ready: boolean }> {
    return [
      { provider: 'easypaisa', sandbox: this.isSandbox(), ready: this.isProductionReady('easypaisa') },
      { provider: 'jazzcash', sandbox: this.isSandbox(), ready: this.isProductionReady('jazzcash') },
      { provider: 'bank', sandbox: this.isSandbox(), ready: this.isProductionReady('bank') },
      { provider: 'stripe', sandbox: this.isSandbox(), ready: this.isProductionReady('stripe') },
    ];
  }
}
