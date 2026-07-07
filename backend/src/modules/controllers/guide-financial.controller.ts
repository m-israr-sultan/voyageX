import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import {
  CreateGuidePayoutAccountDto,
  PayoutListQueryDto,
  RejectPayoutAccountDto,
  UpdateGuidePayoutAccountDto,
} from '../dto/financial.dto';
import { GuidePayoutAccountService } from '../financial/services/guide-payout-account.service';
import { PayoutOrchestrationService } from '../financial/services/payout-orchestration.service';

@Controller('guides/payout-accounts')
@Roles(UserRole.GUIDE)
export class GuidePayoutAccountsController {
  constructor(private readonly accounts: GuidePayoutAccountService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.accounts.listForGuide(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateGuidePayoutAccountDto) {
    return this.accounts.createForGuide(user.id, body);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateGuidePayoutAccountDto,
  ) {
    return this.accounts.updateForGuide(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accounts.deleteForGuide(user.id, id);
  }

  @Patch(':id/default')
  setDefault(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accounts.setDefaultForGuide(user.id, id);
  }
}

@Controller('guides/wallet')
@Roles(UserRole.GUIDE)
export class GuideWalletController {
  constructor(private readonly payouts: PayoutOrchestrationService) {}

  @Get()
  wallet(@CurrentUser() user: AuthUser, @Query() query: PayoutListQueryDto) {
    return this.payouts.getGuideWallet(user.id, {
      status: query.status,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    });
  }
}
