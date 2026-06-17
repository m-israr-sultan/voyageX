import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { UpdateReportStatusDto } from '../dto/admin.dto';
import { CoreService } from '../services/core.service';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly core: CoreService) {}

  // ============================================
  // STATS & LISTINGS
  // ============================================

  @Get('stats') stats() { return this.core.adminStats(); }
  @Get('users') users() { return this.core.adminUsers(); }
  @Get('guides') guides() { return this.core.adminGuides(); }
  @Get('agencies') agencies(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.core.adminAgencies({
      page:  page  ? parseInt(page,  10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
  @Get('packages') packages() { return this.core.adminPackages(); }
  @Get('bookings') bookings() { return this.core.adminBookings(); }
  @Get('reports') reports() { return this.core.adminReports(); }
  @Get('disputes') disputes() { return this.core.adminDisputes(); }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  @Patch('users/:id/toggle-status') toggleUser(@Param('id') id: string) { return this.core.toggleUser(id); }

  // ============================================
  // GUIDE APPROVAL (New)
  // ============================================

  @Get('guides/pending') getPendingGuides() { return this.core.getPendingGuides(); }
  @Post('guides/:id/approve') approveGuide(@Param('id') id: string) { return this.core.approveGuide(id); }
  @Post('guides/:id/reject') rejectGuide(@Param('id') id: string, @Body() body: { reason: string }) { return this.core.rejectGuide(id, body.reason); }
  @Patch('guides/:id/verify') verifyGuide(@Param('id') id: string) { return this.core.verifyGuide(id, true); }
  @Patch('guides/:id/unverify') unverifyGuide(@Param('id') id: string) { return this.core.verifyGuide(id, false); }

  // ============================================
  // AGENCY DOCUMENT APPROVAL (New)
  // ============================================

  @Get('agencies/pending') getPendingAgencies() { return this.core.getPendingAgencies(); }
  @Post('agencies/:id/approve-documents') approveAgencyDocuments(@Param('id') id: string) { return this.core.approveAgencyDocuments(id); }
  @Post('agencies/:id/reject-documents') rejectAgencyDocuments(@Param('id') id: string, @Body() body: { reason: string }) { return this.core.rejectAgencyDocuments(id, body.reason); }
  @Patch('agencies/:id/verify') verifyAgency(@Param('id') id: string) { return this.core.verifyAgency(id, true); }
  @Patch('agencies/:id/unverify') unverifyAgency(@Param('id') id: string) { return this.core.verifyAgency(id, false); }

  // ============================================
  // AGENCY SUBSCRIPTION MANAGEMENT (New)
  // ============================================

  @Get('agencies/subscription/expiring') getExpiringSubscriptions() { return this.core.getExpiringSubscriptions(); }
  @Get('subscriptions/history') getSubscriptionHistory() { return this.core.getSubscriptionHistory(); }
  @Get('subscriptions/pending-proofs') getPendingSubscriptionProofs() { return this.core.getPendingSubscriptionProofs(); }
  @Post('subscriptions/:id/approve') approveSubscriptionPayment(@Param('id') id: string) { return this.core.approveSubscriptionPayment(id); }
  @Post('subscriptions/:id/reject') rejectSubscriptionPayment(@Param('id') id: string, @Body() body: { reason: string }) { return this.core.rejectSubscriptionPayment(id, body.reason); }
  @Post('agencies/:id/record-subscription-payment') recordSubscriptionPayment(
    @Param('id') id: string,
    @Body() body: any
  ) { return this.core.recordSubscriptionPayment(id, body); }
  @Post('agencies/:id/update-subscription-status') updateSubscriptionStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) { return this.core.updateSubscriptionStatus(id, body.status); }

  // ============================================
  // PAYMENT PROOF REVIEW (Bank Transfer admin workflow)
  // ============================================

  /** Approve a BANK_TRANSFER payment proof. Payment PENDING_REVIEW → HELD, booking → CONFIRMED. */
  @Patch('payments/:id/approve-proof')
  approvePaymentProof(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    return this.core.approvePaymentProof(id, admin.id);
  }

  /** Reject a BANK_TRANSFER payment proof with a reason. Payment PENDING_REVIEW → FAILED. */
  @Patch('payments/:id/reject-proof')
  rejectPaymentProof(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() body: { reason: string },
  ) {
    return this.core.rejectPaymentProof(id, admin.id, body.reason);
  }

  // ============================================
  // COMMISSION MANAGEMENT
  // Commission system planned for future phase. Do not activate.
  // ============================================

  @Get('commissions/pending') getPendingCommissions() { return this.core.getPendingCommissions(); }
  @Post('commissions/:id/mark-paid') markCommissionPaid(@Param('id') id: string, @Body() body: { transactionId: string }) { return this.core.markCommissionPaid(id, body.transactionId); }

  // ============================================
  // PACKAGE & REPORT MANAGEMENT
  // ============================================

  @Patch('packages/:id/toggle-status') togglePackage(@Param('id') id: string) { return this.core.togglePackage(id); }
  @Patch('reports/:id/status') reportStatus(@Param('id') id: string, @Body() body: UpdateReportStatusDto) { return this.core.reportStatus(id, body.status); }
}