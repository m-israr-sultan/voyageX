import { BadRequestException, Injectable } from '@nestjs/common';
import { PayoutProvider } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const PK_IBAN_REGEX = /^PK\d{2}[A-Z]{4}\d{16}$/;
const MOBILE_REGEX = /^03\d{9}$/;

@Injectable()
export class FinancialValidationService {
  constructor(private readonly prisma: PrismaService) {}

  validateIban(iban: string): void {
    const normalized = iban.replace(/\s/g, '').toUpperCase();
    if (!PK_IBAN_REGEX.test(normalized)) {
      throw new BadRequestException('Invalid Pakistani IBAN format');
    }
  }

  validateMobileNumber(mobileNumber: string): void {
    const normalized = mobileNumber.replace(/\s/g, '');
    if (!MOBILE_REGEX.test(normalized)) {
      throw new BadRequestException('Invalid mobile number. Use format 03XXXXXXXXX');
    }
  }

  validatePayoutProviderFields(
    provider: PayoutProvider,
    fields: { mobileNumber?: string; iban?: string; bankName?: string },
  ): void {
    switch (provider) {
      case PayoutProvider.EASYPAISA:
      case PayoutProvider.JAZZCASH:
        if (!fields.mobileNumber) {
          throw new BadRequestException(`${provider} payout account requires a mobile number`);
        }
        this.validateMobileNumber(fields.mobileNumber);
        break;
      case PayoutProvider.BANK:
        if (!fields.iban) {
          throw new BadRequestException('Bank payout account requires an IBAN');
        }
        if (!fields.bankName?.trim()) {
          throw new BadRequestException('Bank payout account requires a bank name');
        }
        this.validateIban(fields.iban);
        break;
      default:
        throw new BadRequestException(`Unsupported payout provider: ${provider}`);
    }
  }

  async assertNoDuplicatePayoutAccount(
    guideId: string,
    provider: PayoutProvider,
    fields: { mobileNumber?: string; iban?: string },
  ): Promise<void> {
    if (fields.mobileNumber) {
      const existingMobile = await this.prisma.guide_payout_accounts.findFirst({
        where: { guideId, provider, mobileNumber: fields.mobileNumber },
      });
      if (existingMobile) {
        throw new BadRequestException('A payout account with this mobile number already exists');
      }
    }

    if (fields.iban) {
      const normalizedIban = fields.iban.replace(/\s/g, '').toUpperCase();
      const existingIban = await this.prisma.guide_payout_accounts.findFirst({
        where: { guideId, provider, iban: normalizedIban },
      });
      if (existingIban) {
        throw new BadRequestException('A payout account with this IBAN already exists');
      }
    }
  }

  async assertUniqueReceiptNumber(receiptNumber: string): Promise<void> {
    const existing = await this.prisma.receipts.findUnique({ where: { receiptNumber } });
    if (existing) {
      throw new BadRequestException('Receipt number already exists');
    }
  }

  async assertUniqueLedgerReference(referenceNumber: string): Promise<void> {
    const existing = await this.prisma.financial_ledger.findUnique({
      where: { referenceNumber },
    });
    if (existing) {
      throw new BadRequestException('Ledger reference already exists');
    }
  }

  async assertUniquePayoutReference(voyagexReference: string): Promise<void> {
    const existing = await this.prisma.guide_payouts.findUnique({
      where: { voyagexReference },
    });
    if (existing) {
      throw new BadRequestException('Payout reference already exists');
    }
  }

  async assertNoDuplicatePayout(bookingId: string, paymentId: string): Promise<void> {
    const existing = await this.prisma.guide_payouts.findUnique({
      where: { bookingId_paymentId: { bookingId, paymentId } },
    });
    if (existing) {
      throw new BadRequestException('A payout record already exists for this booking payment');
    }
  }
}
