import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  private uid(): string {
    return crypto.randomUUID();
  }

  private ts(): Date {
    return new Date();
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any
  ) {
    return this.prisma.notifications.create({
      data: {
        id: this.uid(),
        userId,
        type,
        title,
        body,
        data: data || {},
        createdAt: this.ts(),
      },
    });
  }

  // ============================================
  // BOOKING NOTIFICATIONS
  // ============================================

  async notifyBookingConfirmed(bookingId: string, travelerId: string, guideId: string, packageTitle: string, amount: number) {
    await this.createNotification(
      travelerId,
      NotificationType.BOOKING_CONFIRMED,
      'Booking Confirmed',
      `Your booking for "${packageTitle}" has been confirmed. Rs ${amount.toLocaleString()} is held securely in escrow.`,
      { bookingId, type: 'TRAVELER', amount }
    );

    await this.createNotification(
      guideId,
      NotificationType.PAYMENT_HELD,
      'Payment Received & Held',
      `Rs ${amount.toLocaleString()} has been received and held in escrow for booking "${packageTitle}". Funds will be released after traveler confirms completion.`,
      { bookingId, type: 'GUIDE', amount }
    );
  }

  async notifyTourStarted(bookingId: string, travelerId: string, guideName: string) {
    await this.createNotification(
      travelerId,
      NotificationType.TOUR_STARTED,
      'Tour Started',
      `${guideName} has started the tour. Enjoy your experience!`,
      { bookingId }
    );
  }

  async notifyCompletionRequested(bookingId: string, travelerId: string, guideName: string, autoReleaseDate: Date, amount: number) {
    await this.createNotification(
      travelerId,
      NotificationType.COMPLETION_REQUESTED,
      'Tour Completion Requested',
      `${guideName} has marked the tour as completed. Please confirm if you are satisfied. If no action within 7 days, Rs ${amount.toLocaleString()} will be auto-released to the guide.`,
      { bookingId, autoReleaseDate: autoReleaseDate.toISOString(), amount }
    );
  }

  async notifyCompletionConfirmed(bookingId: string, guideId: string, travelerName: string, amount: number) {
    await this.createNotification(
      guideId,
      NotificationType.COMPLETION_CONFIRMED,
      'Tour Completed & Payment Released',
      `${travelerName} has confirmed tour completion. Rs ${amount.toLocaleString()} has been released to your account.`,
      { bookingId, amount }
    );
  }

  async notifyBookingCompleted(bookingId: string, travelerId: string, packageTitle: string) {
    await this.createNotification(
      travelerId,
      NotificationType.BOOKING_COMPLETED,
      'Trip Completed',
      `Your booking for "${packageTitle}" is now complete. We hope you had a great trip!`,
      { bookingId },
    );
  }

  async notifyBookingCancelled(bookingId: string, travelerId: string, guideId: string, packageTitle: string) {
    await this.createNotification(
      travelerId,
      NotificationType.BOOKING_CANCELLED,
      'Booking Cancelled',
      `Your booking for "${packageTitle}" has been cancelled.`,
      { bookingId }
    );

    await this.createNotification(
      guideId,
      NotificationType.BOOKING_CANCELLED,
      'Booking Cancelled',
      `Booking for "${packageTitle}" has been cancelled.`,
      { bookingId }
    );
  }

  // ============================================
  // DISPUTE NOTIFICATIONS
  // ============================================

  async notifyDisputeRaised(bookingId: string, adminId: string, travelerName: string, reason: string) {
    await this.createNotification(
      adminId,
      NotificationType.DISPUTE_RAISED,
      'New Dispute Raised',
      `${travelerName} has raised a dispute for booking. Reason: ${reason}`,
      { bookingId, admin: true }
    );
  }

  async notifyDisputeResolved(bookingId: string, travelerId: string, guideId: string, decision: string) {
    await this.createNotification(
      travelerId,
      NotificationType.DISPUTE_RESOLVED,
      'Dispute Resolved',
      `Your dispute has been resolved. Decision: ${decision}`,
      { bookingId }
    );

    await this.createNotification(
      guideId,
      NotificationType.DISPUTE_RESOLVED,
      'Dispute Resolved',
      `The dispute has been resolved. Decision: ${decision}`,
      { bookingId }
    );
  }

  // ============================================
  // GUIDE APPROVAL NOTIFICATIONS
  // ============================================

  async notifyGuideApproved(guideId: string, guideName: string, freePeriodEndsAt: Date) {
    await this.createNotification(
      guideId,
      NotificationType.GUIDE_APPROVED,
      'Profile Approved!',
      `Congratulations ${guideName}! Your guide profile has been approved. You will receive 0% commission for the first 3 months until ${freePeriodEndsAt.toLocaleDateString()}.`,
      { freePeriodEndsAt: freePeriodEndsAt.toISOString() }
    );
  }

  async notifyGuideRejected(guideId: string, guideName: string, reason: string) {
    await this.createNotification(
      guideId,
      NotificationType.GUIDE_REJECTED,
      'Profile Update Required',
      `Your guide profile needs updates. Reason: ${reason}. Please edit your profile and resubmit.`,
      { reason }
    );
  }

  // ============================================
  // AGENCY NOTIFICATIONS
  // ============================================

  async notifyAgencyDocumentsApproved(agencyId: string, agencyName: string, freePeriodEndsAt: Date) {
    await this.createNotification(
      agencyId,
      NotificationType.AGENCY_DOCUMENTS_APPROVED,
      'Documents Approved!',
      `Congratulations ${agencyName}! Your documents have been approved. You are on FREE TRIAL until ${freePeriodEndsAt.toLocaleDateString()}. No subscription fee required during this period.`,
      { freePeriodEndsAt: freePeriodEndsAt.toISOString() }
    );
  }

  async notifyAgencySubscriptionReminder(agencyId: string, agencyName: string, daysRemaining: number) {
    await this.createNotification(
      agencyId,
      NotificationType.AGENCY_SUBSCRIPTION_REMINDER,
      'Free Trial Ending Soon',
      `Your free trial ends in ${daysRemaining} days. Please subscribe (5,000 PKR/month) to keep your agency visible to travelers.`,
      { daysRemaining }
    );
  }

  async notifyAgencySubscriptionExpired(agencyId: string, agencyName: string) {
    await this.createNotification(
      agencyId,
      NotificationType.AGENCY_SUBSCRIPTION_EXPIRED,
      'Free Trial Ended',
      `Your free trial has ended. Your agency is now hidden from search results. Subscribe now to restore visibility.`,
      {}
    );
  }

  async notifyAgencySubscriptionConfirmed(agencyId: string, agencyName: string, periodEnd: Date) {
    await this.createNotification(
      agencyId,
      NotificationType.AGENCY_SUBSCRIPTION_CONFIRMED,
      'Subscription Active',
      `Your subscription payment has been received. Your agency is active until ${periodEnd.toLocaleDateString()}.`,
      { periodEnd: periodEnd.toISOString() }
    );
  }

  // ============================================
  // COMMISSION NOTIFICATIONS
  // ============================================

  async notifyCommissionDue(agencyId: string, agencyName: string, amount: number, dueDate: Date, bookingId: string) {
    await this.createNotification(
      agencyId,
      NotificationType.COMMISSION_DUE,
      'Commission Payment Due',
      `Commission of Rs ${amount.toLocaleString()} for booking is due by ${dueDate.toLocaleDateString()}. Please pay to avoid service interruption.`,
      { amount, dueDate: dueDate.toISOString(), bookingId }
    );
  }

  async notifyCommissionOverdue(agencyId: string, agencyName: string, amount: number, bookingId: string) {
    await this.createNotification(
      agencyId,
      NotificationType.COMMISSION_OVERDUE,
      'Commission Payment Overdue',
      `Commission of Rs ${amount.toLocaleString()} is now overdue. Your agency may be delisted until payment is received.`,
      { amount, bookingId }
    );
  }

  // ============================================
  // INTERNATIONAL BOOKING NOTIFICATIONS
  // (Renamed from "Manual Booking")
  // ============================================

  async notifyInternationalBookingCreated(adminId: string, bookingId: string, travelerName: string, packageTitle: string) {
    await this.createNotification(
      adminId,
      NotificationType.INTERNATIONAL_BOOKING_CREATED,
      'New International Booking Request',
      `${travelerName} has requested an international booking for "${packageTitle}". Please contact the traveler via WhatsApp.`,
      { bookingId, admin: true },
    );
  }

  /** @deprecated use notifyInternationalBookingCreated */
  async notifyManualBookingCreated(adminId: string, bookingId: string, travelerName: string, packageTitle: string) {
    return this.notifyInternationalBookingCreated(adminId, bookingId, travelerName, packageTitle);
  }

  async notifyInternationalBookingPaymentReceived(bookingId: string, guideId: string, travelerName: string, amount: number) {
    await this.createNotification(
      guideId,
      NotificationType.INTERNATIONAL_BOOKING_PAYMENT_RECEIVED,
      'Payment Received for International Booking',
      `Payment of Rs ${amount.toLocaleString()} has been received from ${travelerName}. Tour can now be confirmed.`,
      { bookingId, amount },
    );
  }

  /** @deprecated use notifyInternationalBookingPaymentReceived */
  async notifyManualBookingPaymentReceived(bookingId: string, guideId: string, travelerName: string, amount: number) {
    return this.notifyInternationalBookingPaymentReceived(bookingId, guideId, travelerName, amount);
  }

  // ============================================
  // AUTO-RELEASE NOTIFICATIONS
  // ============================================

  async notifyAutoReleaseWarning(bookingId: string, travelerId: string, hoursRemaining: number, amount: number) {
    await this.createNotification(
      travelerId,
      NotificationType.AUTO_RELEASE_WARNING,
      'Payment Will Auto-Release Soon',
      `Rs ${amount.toLocaleString()} for your tour will be automatically released in ${hoursRemaining} hours if you do not confirm completion.`,
      { bookingId, hoursRemaining, amount }
    );
  }

  // ============================================
  // PAYOUT NOTIFICATIONS (Phase B)
  // ============================================

  async notifyPayoutInitiated(guideUserId: string, amount: number, bookingId: string) {
    await this.createNotification(
      guideUserId,
      NotificationType.PAYOUT_INITIATED,
      'Payout Initiated',
      `Your payout of Rs ${amount.toLocaleString()} has been initiated and is being processed.`,
      { bookingId, amount },
    );
  }

  async notifyPayoutProcessing(guideUserId: string, amount: number, bookingId: string) {
    await this.createNotification(
      guideUserId,
      NotificationType.PAYOUT_PROCESSING,
      'Payout Processing',
      `Rs ${amount.toLocaleString()} is being transferred to your payout account.`,
      { bookingId, amount },
    );
  }

  async notifyPayoutCompleted(guideUserId: string, amount: number, bookingId: string) {
    await this.createNotification(
      guideUserId,
      NotificationType.PAYOUT_COMPLETED,
      'Payout Completed',
      `Rs ${amount.toLocaleString()} has been successfully transferred to your account.`,
      { bookingId, amount },
    );
  }

  async notifyPayoutFailed(
    guideUserId: string,
    amount: number,
    bookingId: string,
    reason: string,
  ) {
    await this.createNotification(
      guideUserId,
      NotificationType.PAYOUT_FAILED,
      'Payout Failed',
      `Your payout of Rs ${amount.toLocaleString()} could not be completed. Our team will retry automatically.`,
      { bookingId, amount, reason },
    );
  }

  async notifyPayoutAccountApproved(guideUserId: string, provider: string) {
    await this.createNotification(
      guideUserId,
      NotificationType.PAYOUT_ACCOUNT_APPROVED,
      'Payout Account Approved',
      `Your ${provider} payout account has been verified and is ready to receive payments.`,
      { provider },
    );
  }

  async notifyPayoutAccountRejected(guideUserId: string, provider: string, reason: string) {
    await this.createNotification(
      guideUserId,
      NotificationType.PAYOUT_ACCOUNT_REJECTED,
      'Payout Account Rejected',
      `Your ${provider} payout account was rejected. Reason: ${reason}`,
      { provider, reason },
    );
  }
}