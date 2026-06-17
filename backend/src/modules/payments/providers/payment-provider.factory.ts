import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { IPaymentProvider } from './payment-provider.interface';
import { EasypaisaProvider } from './easypaisa.provider';
import { JazzcashProvider } from './jazzcash.provider';
import { CardProvider } from './card.provider';
import { BankTransferProvider } from './bank-transfer.provider';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly easypaisa: EasypaisaProvider,
    private readonly jazzcash: JazzcashProvider,
    private readonly card: CardProvider,
    private readonly bankTransfer: BankTransferProvider,
  ) {}

  getProvider(method: PaymentMethod): IPaymentProvider {
    switch (method) {
      case PaymentMethod.EASYPAISA:
        return this.easypaisa;
      case PaymentMethod.JAZZCASH:
        return this.jazzcash;
      case PaymentMethod.CARD:
        return this.card;
      case PaymentMethod.BANK_TRANSFER:
        return this.bankTransfer;
      default:
        throw new BadRequestException(
          `Unsupported payment method: ${method}. ` +
          `Permitted methods: EASYPAISA, JAZZCASH, CARD, BANK_TRANSFER`,
        );
    }
  }
}
