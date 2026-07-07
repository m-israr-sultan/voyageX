import { BadRequestException, Injectable } from '@nestjs/common';
import { PayoutProvider } from '@prisma/client';
import { EasypaisaPayoutGateway } from './easypaisa-payout.gateway';
import { JazzcashPayoutGateway } from './jazzcash-payout.gateway';
import { BankPayoutGateway } from './bank-payout.gateway';
import { IPayoutGateway } from './payout-gateway.interface';

@Injectable()
export class PayoutGatewayFactory {
  constructor(
    private readonly easypaisa: EasypaisaPayoutGateway,
    private readonly jazzcash: JazzcashPayoutGateway,
    private readonly bank: BankPayoutGateway,
  ) {}

  getGateway(provider: PayoutProvider): IPayoutGateway {
    switch (provider) {
      case PayoutProvider.EASYPAISA:
        return this.easypaisa;
      case PayoutProvider.JAZZCASH:
        return this.jazzcash;
      case PayoutProvider.BANK:
        return this.bank;
      default:
        throw new BadRequestException(`Unsupported payout provider: ${provider}`);
    }
  }
}
