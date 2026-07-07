import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { PayoutListQueryDto, RejectPayoutAccountDto } from '../dto/financial.dto';
import { GuidePayoutAccountService } from '../financial/services/guide-payout-account.service';
import { PayoutOrchestrationService } from '../financial/services/payout-orchestration.service';

@Controller('admin/payouts')
@Roles(UserRole.ADMIN)
export class AdminPayoutsController {
  constructor(
    private readonly accounts: GuidePayoutAccountService,
    private readonly payouts: PayoutOrchestrationService,
  ) {}

  @Get('accounts/pending')
  pendingAccounts() {
    return this.accounts.listPendingForAdmin();
  }

  @Post('accounts/:id/approve')
  approveAccount(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.accounts.approveAccount(admin.id, id);
  }

  @Post('accounts/:id/reject')
  rejectAccount(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() body: RejectPayoutAccountDto,
  ) {
    return this.accounts.rejectAccount(admin.id, id, body.reason);
  }

  @Post('accounts/:id/suspend')
  suspendAccount(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.accounts.suspendAccount(admin.id, id, body.reason);
  }

  @Get()
  listPayouts(@Query() query: PayoutListQueryDto) {
    return this.payouts.listPayoutsForAdmin({
      status: query.status,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 25,
    });
  }

  @Post(':id/retry')
  retryPayout(@Param('id') id: string) {
    return this.payouts.retryPayout(id);
  }
}
