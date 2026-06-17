import { Body, Controller, Get, Param, Put, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { UpdateAgencyProfileDto } from '../dto/agencies.dto';
import { CoreService } from '../services/core.service';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly core: CoreService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @Public()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('minRating') minRating?: string,
    @Query('isVerified') isVerified?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      city,
      country,
      minRating: minRating ? parseFloat(minRating) : undefined,
      isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
      sortBy,
      sortOrder,
    };
    return this.core.agencies(params);
  }

  // ============================================
  // AGENCY PROFILE (MUST be before :slug)
  // ============================================

  @Get('my-profile')
  @Roles(UserRole.AGENCY)
  my(@CurrentUser() user: AuthUser) {
    return this.core.myAgencyProfile(user.id);
  }

  @Put('my-profile')
  @Roles(UserRole.AGENCY)
  update(@CurrentUser() user: AuthUser, @Body() body: UpdateAgencyProfileDto) {
    return this.core.updateMyAgencyProfile(user.id, body);
  }

  // ============================================
  // DOCUMENT APPROVAL STATUS
  // ============================================

  @Get('my-approval-status')
  @Roles(UserRole.AGENCY)
  getApprovalStatus(@CurrentUser() user: AuthUser) {
    return this.core.getAgencyApprovalStatus(user.id);
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  @Get('my-subscription')
  @Roles(UserRole.AGENCY)
  getMySubscription(@CurrentUser() user: AuthUser) {
    return this.core.getMySubscription(user.id);
  }

  @Post('pay-subscription')
  @Roles(UserRole.AGENCY)
  paySubscription(
    @CurrentUser() user: AuthUser,
    @Body() body: { paymentMethod: string; transactionId: string },
  ) {
    return this.core.paySubscription(user.id, body);
  }

  // ============================================
  // COMMISSION MANAGEMENT
  // ============================================

  @Get('commission-history')
  @Roles(UserRole.AGENCY)
  getCommissionHistory(@CurrentUser() user: AuthUser) {
    return this.core.getCommissionHistory(user.id);
  }

  @Post('pay-commission/:bookingId')
  @Roles(UserRole.AGENCY)
  payCommission(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Body() body: { transactionId: string },
  ) {
    return this.core.payCommission(user.id, bookingId, body.transactionId);
  }

  // ============================================
  // WILDCARD ROUTE (MUST be LAST)
  // ============================================

  @Get(':slug')
  @Public()
  get(@Param('slug') slug: string) {
    return this.core.agencyBySlug(slug);
  }
}