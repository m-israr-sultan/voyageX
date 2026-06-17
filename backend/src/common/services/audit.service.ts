import { Injectable, Logger } from '@nestjs/common';

export type AuditAction =
  | 'booking.created'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.completed'
  | 'booking.disputed'
  | 'booking.dispute_resolved'
  | 'booking.tour_started'
  | 'booking.completion_requested'
  | 'payment.initiated'
  | 'payment.amount_mismatch'
  | 'payment.released'
  | 'payment.auto_released'
  | 'payment.refunded'
  | 'payment.proof_approved'
  | 'payment.proof_rejected'
  | 'payment.webhook_confirmed'
  | 'payment.webhook_failed'
  | 'payment.webhook_signature_failed'
  | 'payment.sandbox_confirmed'
  | 'subscription.payment_recorded'
  | 'subscription.proof_submitted'
  | 'subscription.approved'
  | 'subscription.rejected'
  | 'verification.document_uploaded'
  | 'verification.document_approved'
  | 'verification.document_rejected'
  // International booking (renamed from manual_booking.*)
  | 'international_booking.created'
  | 'international_booking.whatsapp_assigned'
  | 'international_booking.payment_received'
  | 'international_booking.guide_assigned'
  | 'international_booking.completed'
  | 'international_booking.cancelled'
  // Legacy aliases kept during rename transition
  | 'manual_booking.created'
  | 'manual_booking.whatsapp_assigned'
  | 'manual_booking.payment_received'
  | 'manual_booking.guide_assigned'
  | 'manual_booking.completed'
  | 'manual_booking.cancelled'
  | 'message.flagged'
  | 'user.deactivated'
  | 'guide.approved'
  | 'guide.rejected'
  | 'agency.approved'
  | 'agency.rejected';

export interface AuditRecord {
  action: AuditAction;
  actorId?: string;
  actorRole?: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AUDIT');

  log(record: AuditRecord): void {
    this.logger.log(
      JSON.stringify({
        ...record,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
