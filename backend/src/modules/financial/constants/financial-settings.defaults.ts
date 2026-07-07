import { PLATFORM_CONFIG } from '../../../common/config/platform.config';

export type FinancialSettingDefault = {
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  label: string;
  description: string;
  category: string;
};

export const FINANCIAL_SETTING_DEFAULTS: FinancialSettingDefault[] = [
  {
    key: 'guideCommissionRate',
    value: String(PLATFORM_CONFIG.guideCommissionRate),
    valueType: 'NUMBER',
    label: 'Guide Commission Rate (%)',
    description: 'Platform commission deducted from guide earnings',
    category: 'commission',
  },
  {
    key: 'agencySubscriptionAmount',
    value: String(PLATFORM_CONFIG.agencySubscriptionAmount),
    valueType: 'NUMBER',
    label: 'Agency Subscription Amount',
    description: 'Monthly agency subscription fee in PKR',
    category: 'subscription',
  },
  {
    key: 'currency',
    value: PLATFORM_CONFIG.currency,
    valueType: 'STRING',
    label: 'Currency',
    description: 'Default platform currency',
    category: 'general',
  },
  {
    key: 'sandboxMode',
    value: String(PLATFORM_CONFIG.sandboxMode),
    valueType: 'BOOLEAN',
    label: 'Sandbox Mode',
    description: 'When true, gateway providers run in sandbox mode',
    category: 'gateway',
  },
  {
    key: 'payoutMaxRetries',
    value: String(PLATFORM_CONFIG.payoutMaxRetries),
    valueType: 'NUMBER',
    label: 'Payout Max Retries',
    description: 'Maximum automatic payout retry attempts',
    category: 'payout',
  },
  {
    key: 'minimumPayoutAmount',
    value: '100',
    valueType: 'NUMBER',
    label: 'Minimum Payout Amount',
    description: 'Minimum amount for guide payouts in PKR',
    category: 'payout',
  },
  {
    key: 'maximumPayoutAmount',
    value: '5000000',
    valueType: 'NUMBER',
    label: 'Maximum Payout Amount',
    description: 'Maximum single payout amount in PKR',
    category: 'payout',
  },
  {
    key: 'escrowGracePeriodDays',
    value: String(PLATFORM_CONFIG.escrowGracePeriodDays),
    valueType: 'NUMBER',
    label: 'Escrow Grace Period (days)',
    description: 'Days after trip end before auto-release eligibility',
    category: 'escrow',
  },
  {
    key: 'escrowDefaultHoldDays',
    value: String(PLATFORM_CONFIG.escrowDefaultHoldDays),
    valueType: 'NUMBER',
    label: 'Escrow Default Hold (days)',
    description: 'Default escrow hold when trip end unknown',
    category: 'escrow',
  },
  {
    key: 'refundWindowDays',
    value: '30',
    valueType: 'NUMBER',
    label: 'Refund Window (days)',
    description: 'Days after completion when refunds are allowed',
    category: 'refund',
  },
  {
    key: 'receiptPrefix',
    value: 'VX-RCPT',
    valueType: 'STRING',
    label: 'Receipt Prefix',
    description: 'Prefix for receipt reference numbers',
    category: 'receipt',
  },
  {
    key: 'invoicePrefix',
    value: 'VX-INV',
    valueType: 'STRING',
    label: 'Invoice Prefix',
    description: 'Prefix for invoice reference numbers',
    category: 'receipt',
  },
  {
    key: 'supportedPaymentGateways',
    value: JSON.stringify(['EASYPAISA', 'JAZZCASH', 'CARD', 'BANK_TRANSFER']),
    valueType: 'JSON',
    label: 'Supported Payment Gateways',
    description: 'Enabled inbound payment providers',
    category: 'gateway',
  },
  {
    key: 'supportedPayoutGateways',
    value: JSON.stringify(['EASYPAISA', 'JAZZCASH', 'BANK']),
    valueType: 'JSON',
    label: 'Supported Payout Gateways',
    description: 'Enabled outbound payout providers',
    category: 'gateway',
  },
  {
    key: 'monetizationEnabled',
    value: String(PLATFORM_CONFIG.monetizationEnabled),
    valueType: 'BOOLEAN',
    label: 'Monetization Enabled',
    description: 'Master switch for commission and subscriptions',
    category: 'commission',
  },
];
