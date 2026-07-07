import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';

export type FinancialReferencePrefix =
  | 'VX-PAY'
  | 'VX-PAYOUT'
  | 'VX-LEDGER'
  | 'VX-RCPT'
  | 'VX-INV';

@Injectable()
export class FinancialReferenceService {
  /**
   * Generates a unique VoyageX financial reference.
   * Format: PREFIX-YYYYMMDD-RANDOM (e.g. VX-PAYOUT-20260706-A1B2C3D4)
   */
  generateReference(prefix: FinancialReferencePrefix): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${date}-${suffix}`;
  }

  generateReceiptNumber(): string {
    return this.generateReference('VX-RCPT');
  }

  generateInvoiceNumber(): string {
    return this.generateReference('VX-INV');
  }

  generateLedgerReference(): string {
    return this.generateReference('VX-LEDGER');
  }

  generatePayoutReference(): string {
    return this.generateReference('VX-PAYOUT');
  }

  generateVerificationToken(): string {
    return randomUUID().replace(/-/g, '');
  }
}
