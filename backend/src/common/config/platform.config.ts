/**
 * Centralized VoyageX platform configuration.
 * All business rules and monetization parameters live here.
 * Do NOT hardcode these values elsewhere in the codebase.
 */
export const PLATFORM_CONFIG = {
  /** Official launch date — free period starts from this date */
  launchDate: new Date('2026-09-01'),

  /** How many months after launch the free period lasts */
  freePeriodMonths: 3,

  /**
   * Guide commission rate (percentage).
   * Commission system planned for future phase. Do not activate.
   * During free period: commission is collected architecturally but payout = 100%.
   * After free period: guide receives (100 - guideCommissionRate)%.
   */
  guideCommissionRate: 15,

  /**
   * Monthly subscription fee for agencies (PKR).
   * This is the ONLY permitted value — never hardcode 10000 elsewhere.
   * During free period: not enforced.
   * After free period: agencies must pay to remain active.
   */
  agencySubscriptionAmount: 10000,

  /** Currency for all platform transactions */
  currency: 'PKR',

  /** Agency subscription period in days (always 30 — monthly) */
  subscriptionPeriodDays: 30,

  /** Days before subscription expiry to send first reminder */
  subscriptionReminderDays: 7,

  /** Days before subscription expiry to send urgent reminder */
  subscriptionUrgentReminderDays: 3,

  /**
   * Escrow hold grace period in days added after trip end date.
   * If trip end date is unknown, use escrowDefaultHoldDays instead.
   */
  escrowGracePeriodDays: 7,

  /** Default escrow hold period in days when trip end date is unknown */
  escrowDefaultHoldDays: 30,

  /** Abandoned payment cleanup cutoff in hours */
  abandonedPaymentCutoffHours: 2,

  /**
   * Master switch for monetization.
   * false = free period; no commissions deducted, no subscription required.
   * true  = full revenue model active.
   * Flip this to true after freePeriodMonths have elapsed.
   */
  monetizationEnabled: false,

  /** VoyageX admin WhatsApp number for international booking inquiries */
  adminWhatsAppNumber: '923199052314',

  /** Sandbox mode — set to false only when real gateway credentials are active */
  sandboxMode: true,

  /** Maximum automatic payout retry attempts after gateway failure */
  payoutMaxRetries: 3,

  /** How long a checkout draft (BookingDraft) stays valid before expiring */
  bookingDraftExpiryMinutes: 30,

  /**
   * CANCELLATION POLICY
   * Rule 1: full refund if cancelled within `cancellationFullRefundWindowMinutes`
   *         of the booking being created, regardless of trip date.
   * Rule 2 & 3: outside that grace window, cancellation is still allowed any
   *         time before the trip starts, but only cancellations made at
   *         least `cancellationDeadlineHours` before the trip start receive
   *         a full refund — inside that window the refund is reduced to
   *         `cancellationReducedRefundPercent`.
   * Rule 4: cancellation is blocked entirely once the trip has started
   *         (admin override excepted).
   */
  cancellationFullRefundWindowMinutes: 60,
  cancellationDeadlineHours: 72,
  cancellationReducedRefundPercent: 50,

  /** How many days of raw analytics events/pageviews/sessions to retain before pruning (Phase N) */
  analyticsRetentionDays: 180,

  /** Session inactivity timeout in minutes — a new session starts after this much idle time (Phase N) */
  analyticsSessionTimeoutMinutes: 30,
} as const;

/**
 * Returns true if the free period is still active based on launchDate + freePeriodMonths.
 * When monetizationEnabled is explicitly true, free period is considered over.
 */
export function isFreePeriodActive(): boolean {
  if (PLATFORM_CONFIG.monetizationEnabled) return false;
  const freeEnd = new Date(PLATFORM_CONFIG.launchDate);
  freeEnd.setMonth(freeEnd.getMonth() + PLATFORM_CONFIG.freePeriodMonths);
  return new Date() < freeEnd;
}

/**
 * Returns the effective guide commission rate.
 * Returns 0 during free period; guideCommissionRate after.
 */
export function effectiveGuideCommissionRate(): number {
  return isFreePeriodActive() ? 0 : PLATFORM_CONFIG.guideCommissionRate;
}

export interface CancellationPolicyResult {
  allowed: boolean;
  refundPercent: number;
  reason: string;
}

/**
 * Evaluates the booking cancellation policy (see PLATFORM_CONFIG comments).
 * `bypassDeadline` lets an admin cancel after the trip has started; it does
 * NOT change the refund percentage — admins can still adjust the refund
 * manually afterwards via the existing admin refund tools if needed.
 */
export function evaluateCancellationPolicy(
  createdAt: Date,
  startDate: Date,
  now: Date = new Date(),
  bypassDeadline = false,
): CancellationPolicyResult {
  const msSinceBooking = now.getTime() - createdAt.getTime();
  const msUntilTrip = startDate.getTime() - now.getTime();

  if (msUntilTrip <= 0 && !bypassDeadline) {
    return { allowed: false, refundPercent: 0, reason: 'Cannot cancel after the trip has started' };
  }

  if (msSinceBooking <= PLATFORM_CONFIG.cancellationFullRefundWindowMinutes * 60_000) {
    return {
      allowed: true,
      refundPercent: 100,
      reason: `Full refund — cancelled within ${PLATFORM_CONFIG.cancellationFullRefundWindowMinutes} minutes of booking`,
    };
  }

  const hoursUntilTrip = msUntilTrip / 3_600_000;
  if (hoursUntilTrip >= PLATFORM_CONFIG.cancellationDeadlineHours) {
    return {
      allowed: true,
      refundPercent: 100,
      reason: `Full refund — cancelled more than ${PLATFORM_CONFIG.cancellationDeadlineHours}h before trip start`,
    };
  }

  return {
    allowed: true,
    refundPercent: PLATFORM_CONFIG.cancellationReducedRefundPercent,
    reason: `Reduced refund (${PLATFORM_CONFIG.cancellationReducedRefundPercent}%) — cancelled within ${PLATFORM_CONFIG.cancellationDeadlineHours}h of trip start`,
  };
}
