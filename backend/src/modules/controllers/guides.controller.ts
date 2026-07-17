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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import {
  CreateGuidePayoutAccountDto,
  PayoutListQueryDto,
  UpdateGuidePayoutAccountDto,
} from '../dto/financial.dto';
import { UpdateGuideProfileDto } from '../dto/guides.dto';
import { GuidePayoutAccountService } from '../financial/services/guide-payout-account.service';
import { PayoutOrchestrationService } from '../financial/services/payout-orchestration.service';
import { CoreService } from '../services/core.service';

@Controller('guides')
export class GuidesController {
  constructor(
    private readonly core: CoreService,
    private readonly payoutAccounts: GuidePayoutAccountService,
    private readonly payouts: PayoutOrchestrationService,
  ) {}

  // ============================================
  // STATIC GUIDE ROUTES (must precede :slug)
  // ============================================

  @Get('my-profile')
  @Roles(UserRole.GUIDE)
  my(@CurrentUser() user: AuthUser) {
    return this.core.myGuideProfile(user.id);
  }

  @Put('my-profile')
  @Roles(UserRole.GUIDE)
  update(@CurrentUser() user: AuthUser, @Body() body: UpdateGuideProfileDto) {
    return this.core.updateMyGuideProfile(user.id, body);
  }

  @Get('my-approval-status')
  @Roles(UserRole.GUIDE)
  getApprovalStatus(@CurrentUser() user: AuthUser) {
    return this.core.getGuideApprovalStatus(user.id);
  }

  @Get('wallet')
  @Roles(UserRole.GUIDE)
  wallet(@CurrentUser() user: AuthUser, @Query() query: PayoutListQueryDto) {
    return this.payouts.getGuideWallet(user.id, {
      status: query.status,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    });
  }

  @Get('payout-accounts')
  @Roles(UserRole.GUIDE)
  listPayoutAccounts(@CurrentUser() user: AuthUser) {
    return this.payoutAccounts.listForGuide(user.id);
  }

  @Post('payout-accounts')
  @Roles(UserRole.GUIDE)
  createPayoutAccount(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateGuidePayoutAccountDto,
  ) {
    return this.payoutAccounts.createForGuide(user.id, body);
  }

  @Put('payout-accounts/:id')
  @Roles(UserRole.GUIDE)
  updatePayoutAccount(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateGuidePayoutAccountDto,
  ) {
    return this.payoutAccounts.updateForGuide(user.id, id, body);
  }

  @Delete('payout-accounts/:id')
  @Roles(UserRole.GUIDE)
  removePayoutAccount(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payoutAccounts.deleteForGuide(user.id, id);
  }

  @Patch('payout-accounts/:id/default')
  @Roles(UserRole.GUIDE)
  setDefaultPayoutAccount(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payoutAccounts.setDefaultForGuide(user.id, id);
  }

  // ============================================
  // PUBLIC ENDPOINTS (dynamic routes last)
  // ============================================

  @Get()
  @Public()
  list() {
    return this.core.guides();
  }

  // Phase G — booked date ranges for a guide, used by the booking wizard
  // and public guide/package pages to block overlapping dates.
  @Get(':id/availability')
  @Public()
  availability(@Param('id') id: string) {
    return this.core.getGuideAvailability(id);
  }

  @Get(':slug')
  @Public()
  get(@Param('slug') slug: string) {
    return this.core.guideBySlug(slug);
  }
}
