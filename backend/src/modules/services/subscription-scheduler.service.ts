import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { AuditService } from '../../common/services/audit.service';
import { PLATFORM_CONFIG } from '../../common/config/platform.config';
import { NotificationType, SubscriptionStatus } from '@prisma/client';

/**
 * Subscription lifecycle scheduler.
 *
 * Runs daily. Enforces subscription rules:
 *   - Agencies with subscriptionEndDate < now() are set to EXPIRED
 *   - Their packages are hidden from public listings
 *   - Reminders are sent at 7, 3, and 1 day(s) before expiry
 */
@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  /** Run daily at 01:00 UTC */
  @Cron('0 0 1 * * *')
  async processSubscriptionExpiry(): Promise<void> {
    const now = new Date();
    this.logger.log('SubscriptionScheduler: running expiry check');

    // 1. Expire overdue subscriptions
    const expired = await this.prisma.agencies.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndDate: { lt: now },
      },
      include: { users: true },
    });

    for (const agency of expired) {
      await this.prisma.agencies.update({
        where: { id: agency.id },
        data: { subscriptionStatus: SubscriptionStatus.EXPIRED, updatedAt: now },
      });

      // Hide all packages
      await this.prisma.packages.updateMany({
        where: { agencyId: agency.id, isActive: true },
        data: { isActive: false },
      });

      await this.notifications.createNotification(
        agency.userId,
        NotificationType.AGENCY_SUBSCRIPTION_EXPIRED,
        'Subscription Expired',
        `Your VoyageX subscription has expired. Your listings have been hidden. ` +
        `Renew your subscription (Rs ${PLATFORM_CONFIG.agencySubscriptionAmount.toLocaleString()}/month) to restore them.`,
        { agencyId: agency.id },
      );

      this.audit.log({
        action: 'subscription.rejected', // closest available audit type
        actorId: 'SYSTEM',
        resourceType: 'agency',
        resourceId: agency.id,
        metadata: { reason: 'subscription_expired', expiredAt: now },
      });

      this.logger.log(`SubscriptionScheduler: expired agency ${agency.id} (${agency.name})`);
    }

    // 2. Send renewal reminders
    const reminderDays = [
      PLATFORM_CONFIG.subscriptionReminderDays,
      PLATFORM_CONFIG.subscriptionUrgentReminderDays,
      1,
    ];

    for (const days of reminderDays) {
      const windowStart = new Date(now.getTime() + (days - 1) * 86_400_000);
      const windowEnd = new Date(now.getTime() + days * 86_400_000);

      const upcoming = await this.prisma.agencies.findMany({
        where: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionEndDate: { gte: windowStart, lt: windowEnd },
        },
        include: { users: true },
      });

      for (const agency of upcoming) {
        await this.notifications.createNotification(
          agency.userId,
          NotificationType.AGENCY_SUBSCRIPTION_REMINDER,
          days === 1
            ? '⚠ Subscription expires tomorrow'
            : days <= PLATFORM_CONFIG.subscriptionUrgentReminderDays
            ? `⚠ Subscription expires in ${days} days`
            : `Subscription renews in ${days} days`,
          `Your VoyageX subscription expires in ${days} day(s). ` +
          `Renew now to avoid interruption (Rs ${PLATFORM_CONFIG.agencySubscriptionAmount.toLocaleString()}/month).`,
          { agencyId: agency.id, daysRemaining: days },
        );
      }
    }

    this.logger.log(
      `SubscriptionScheduler: expired=${expired.length}, processed reminders for ${reminderDays.join(',')} days`,
    );
  }
}
