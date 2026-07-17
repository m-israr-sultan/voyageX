import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CalculatePriceDto,
  CreateBookingDto,
  CreateBookingDraftDto,
  CheckoutBookingDraftDto,
  DisputeDto,
  InitiatePaymentDto,
  AssignInternationalBookingDto,
  MarkInternationalBookingPaidDto,
  AssignGuideToInternationalBookingDto,
} from '../dto/bookings.dto';
import { CoreService } from '../services/core.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly core: CoreService) {}

  @Post('calculate')
  calculate(@Body() body: CalculatePriceDto) {
    return this.core.calculatePrice(body);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: CreateBookingDto) {
    return this.core.createBooking(user.id, body);
  }

  // ============================================================
  // BookingDraft / CheckoutSession (Phase E)
  // Traveler Details -> Billing steps persist a draft here; no real
  // booking exists until POST /bookings/drafts/:id/checkout succeeds.
  // ============================================================

  @Post('drafts')
  createDraft(@CurrentUser() user: { id: string }, @Body() body: CreateBookingDraftDto) {
    return this.core.createBookingDraft(user.id, body);
  }

  @Get('drafts/:id')
  getDraft(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.core.getBookingDraft(id, user.id);
  }

  @Post('drafts/:id/checkout')
  checkoutDraft(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: CheckoutBookingDraftDto,
  ) {
    return this.core.checkoutBookingDraft(id, user.id, body);
  }

  @Get()
  list(@CurrentUser() user: { id: string; role: UserRole }) {
    return this.core.bookings(user.id, user.role);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.core.bookingById(id, user.id, user.role);
  }

  @Patch(':id/start')
  @Roles(UserRole.GUIDE, UserRole.AGENCY)
  start(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.core.startTour(id, user.id);
  }

  @Patch(':id/request-completion')
  @Roles(UserRole.GUIDE, UserRole.AGENCY)
  requestCompletion(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.core.requestCompletion(id, user.id);
  }

  @Patch(':id/confirm-completion')
  confirmCompletion(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.core.confirmCompletion(id, user.id);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.core.cancelBooking(id, user.id, user.role);
  }

  @Post(':id/dispute')
  dispute(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: DisputeDto,
  ) {
    return this.core.raiseDispute(id, user.id, body);
  }

  @Patch(':id/resolve-dispute')
  @Roles(UserRole.ADMIN)
  resolveDispute(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { decision: string; adminNote?: string },
  ) {
    return this.core.resolveDispute(id, user.id, body.decision, body.adminNote ?? '');
  }

  @Post('initiate-payment')
  initiatePayment(@CurrentUser() user: { id: string }, @Body() body: InitiatePaymentDto) {
    return this.core.initiatePayment(user.id, body);
  }

  // ============================================================
  // International Booking Endpoints
  // (Previously "manual/*" — renamed to "international/*")
  // Legacy "manual/*" aliases kept for backward compatibility
  // during transition — these will be removed in a future release.
  // ============================================================

  @Get('international/pending')
  @Roles(UserRole.ADMIN)
  getPendingInternationalBookings() {
    return this.core.getPendingInternationalBookings();
  }

  /** @deprecated use GET /bookings/international/pending */
  @Get('manual/pending')
  @Roles(UserRole.ADMIN)
  getPendingManualBookings() {
    return this.core.getPendingInternationalBookings();
  }

  @Post('international/assign-whatsapp')
  @Roles(UserRole.ADMIN)
  assignWhatsAppToInternationalBooking(@Body() body: AssignInternationalBookingDto) {
    return this.core.assignWhatsAppToInternationalBooking(body);
  }

  /** @deprecated use POST /bookings/international/assign-whatsapp */
  @Post('manual/assign-whatsapp')
  @Roles(UserRole.ADMIN)
  assignWhatsAppToManualBooking(@Body() body: AssignInternationalBookingDto) {
    return this.core.assignWhatsAppToInternationalBooking(body);
  }

  @Post('international/mark-paid')
  @Roles(UserRole.ADMIN)
  markInternationalBookingPaid(@Body() body: MarkInternationalBookingPaidDto) {
    return this.core.markInternationalBookingPaid(body);
  }

  /** @deprecated use POST /bookings/international/mark-paid */
  @Post('manual/mark-paid')
  @Roles(UserRole.ADMIN)
  markManualBookingPaid(@Body() body: MarkInternationalBookingPaidDto) {
    return this.core.markInternationalBookingPaid(body);
  }

  @Post('international/assign-guide')
  @Roles(UserRole.ADMIN)
  assignGuideToInternationalBooking(
    @CurrentUser() user: { id: string },
    @Body() body: AssignGuideToInternationalBookingDto,
  ) {
    return this.core.assignGuideToInternationalBooking(body, user.id);
  }

  /** @deprecated use POST /bookings/international/assign-guide */
  @Post('manual/assign-guide')
  @Roles(UserRole.ADMIN)
  assignGuideToManualBooking(
    @CurrentUser() user: { id: string },
    @Body() body: AssignGuideToInternationalBookingDto,
  ) {
    return this.core.assignGuideToInternationalBooking(body, user.id);
  }

  @Patch('international/:id/complete')
  @Roles(UserRole.ADMIN)
  completeInternationalBooking(@Param('id') id: string) {
    return this.core.completeInternationalBooking(id);
  }

  /** @deprecated use PATCH /bookings/international/:id/complete */
  @Patch('manual/:id/complete')
  @Roles(UserRole.ADMIN)
  completeManualBooking(@Param('id') id: string) {
    return this.core.completeInternationalBooking(id);
  }

  @Patch('international/:id/cancel')
  @Roles(UserRole.ADMIN)
  cancelInternationalBooking(@Param('id') id: string) {
    return this.core.cancelInternationalBooking(id);
  }

  /** @deprecated use PATCH /bookings/international/:id/cancel */
  @Patch('manual/:id/cancel')
  @Roles(UserRole.ADMIN)
  cancelManualBooking(@Param('id') id: string) {
    return this.core.cancelInternationalBooking(id);
  }
}
