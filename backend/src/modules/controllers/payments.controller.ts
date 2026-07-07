import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Headers,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { InitiatePaymentDto } from '../dto/payment-initiation.dto';
import { PaymentWebhookService } from '../financial/services/payment-webhook.service';
import { RefundOrchestrationService } from '../financial/services/refund-orchestration.service';
import { CoreService } from '../services/core.service';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

class RefundBodyDto {
  @IsNumber() @Min(1) amount!: number;
  @IsString() @IsNotEmpty() reason!: string;
}

class RejectProofBodyDto {
  @IsString() @IsNotEmpty() reason!: string;
}

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly core: CoreService,
    private readonly paymentWebhooks: PaymentWebhookService,
    private readonly refunds: RefundOrchestrationService,
  ) {}

  @Post('initiate')
  initiate(@CurrentUser() user: AuthUser, @Body() body: InitiatePaymentDto) {
    return this.core.initiatePayment(user.id, body);
  }

  @Patch(':id/release')
  @Roles(UserRole.ADMIN)
  release(@Param('id') id: string) {
    return this.core.releasePayment(id);
  }

  @Patch(':id/approve-proof')
  @Roles(UserRole.ADMIN)
  approveProof(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.core.approvePaymentProof(id, admin.id);
  }

  @Patch(':id/reject-proof')
  @Roles(UserRole.ADMIN)
  rejectProof(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() body: RejectProofBodyDto,
  ) {
    return this.core.rejectPaymentProof(id, admin.id, body.reason);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  refund(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() body: RefundBodyDto,
  ) {
    return this.core.createRefund(id, admin.id, body.amount, body.reason);
  }

  @Post(':id/refund-request')
  @Roles(UserRole.TRAVELER)
  requestRefund(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: RefundBodyDto,
  ) {
    return this.refunds.requestTravelerRefund(user.id, id, body.amount, body.reason);
  }

  @Patch(':id/sandbox-confirm')
  @Roles(UserRole.ADMIN)
  sandboxConfirm(@Param('id') id: string) {
    return this.core.sandboxConfirmPayment(id);
  }

  @Post('webhook/:provider')
  @Public()
  handleWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ): Promise<{ received: boolean }> {
    return this.paymentWebhooks.handle(provider, headers, body);
  }
}
