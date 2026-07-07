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
