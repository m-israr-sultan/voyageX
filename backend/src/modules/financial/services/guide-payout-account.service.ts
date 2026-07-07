import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PayoutAccountStatus,
  PayoutProvider,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateGuidePayoutAccountDto,
  UpdateGuidePayoutAccountDto,
} from '../../dto/financial.dto';
import { FinancialValidationService } from './financial-validation.service';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class GuidePayoutAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: FinancialValidationService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  private async resolveGuideId(userId: string): Promise<string> {
    const guide = await this.prisma.guides.findUnique({ where: { userId } });
    if (!guide) throw new NotFoundException('Guide profile not found');
    return guide.id;
  }

  async listForGuide(userId: string) {
    const guideId = await this.resolveGuideId(userId);
    return this.prisma.guide_payout_accounts.findMany({
      where: { guideId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createForGuide(userId: string, dto: CreateGuidePayoutAccountDto) {
    const guideId = await this.resolveGuideId(userId);
    this.validation.validatePayoutProviderFields(dto.provider, {
      mobileNumber: dto.mobileNumber,
      iban: dto.iban,
      bankName: dto.bankName,
    });
    await this.validation.assertNoDuplicatePayoutAccount(guideId, dto.provider, {
      mobileNumber: dto.mobileNumber,
      iban: dto.iban,
    });

    const accountCount = await this.prisma.guide_payout_accounts.count({
      where: { guideId },
    });
    const shouldDefault = dto.isDefault === true || accountCount === 0;

    if (shouldDefault) {
      await this.prisma.guide_payout_accounts.updateMany({
        where: { guideId },
        data: { isDefault: false },
      });
    }

    const now = new Date();
    const account = await this.prisma.guide_payout_accounts.create({
      data: {
        id: randomUUID(),
        guideId,
        provider: dto.provider,
        accountTitle: dto.accountTitle.trim(),
        mobileNumber: dto.mobileNumber?.replace(/\s/g, ''),
        iban: dto.iban?.replace(/\s/g, '').toUpperCase(),
        bankName: dto.bankName?.trim(),
        isDefault: shouldDefault,
        accountStatus: PayoutAccountStatus.PENDING_VERIFICATION,
        updatedAt: now,
      },
    });

    this.audit.log({
      action: 'financial.payout_account.created',
      actorId: userId,
      actorRole: UserRole.GUIDE,
      resourceType: 'guide_payout_account',
      resourceId: account.id,
      metadata: { guideId, provider: dto.provider },
    });

    return account;
  }

  async updateForGuide(userId: string, accountId: string, dto: UpdateGuidePayoutAccountDto) {
    const guideId = await this.resolveGuideId(userId);
    const account = await this.prisma.guide_payout_accounts.findFirst({
      where: { id: accountId, guideId },
    });
    if (!account) throw new NotFoundException('Payout account not found');

    const provider = account.provider;
    const mobileNumber = dto.mobileNumber ?? account.mobileNumber ?? undefined;
    const iban = dto.iban ?? account.iban ?? undefined;
    const bankName = dto.bankName ?? account.bankName ?? undefined;

    this.validation.validatePayoutProviderFields(provider, {
      mobileNumber,
      iban,
      bankName,
    });

    if (dto.isDefault) {
      await this.prisma.guide_payout_accounts.updateMany({
        where: { guideId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.guide_payout_accounts.update({
      where: { id: accountId },
      data: {
        accountTitle: dto.accountTitle?.trim() ?? account.accountTitle,
        mobileNumber: dto.mobileNumber?.replace(/\s/g, ''),
        iban: dto.iban?.replace(/\s/g, '').toUpperCase(),
        bankName: dto.bankName?.trim(),
        isDefault: dto.isDefault ?? account.isDefault,
        accountStatus: PayoutAccountStatus.PENDING_VERIFICATION,
        verified: false,
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null,
        updatedAt: new Date(),
      },
    });

    this.audit.log({
      action: 'financial.payout_account.updated',
      actorId: userId,
      actorRole: UserRole.GUIDE,
      resourceType: 'guide_payout_account',
      resourceId: accountId,
      metadata: { guideId },
    });

    return updated;
  }

  async deleteForGuide(userId: string, accountId: string) {
    const guideId = await this.resolveGuideId(userId);
    const account = await this.prisma.guide_payout_accounts.findFirst({
      where: { id: accountId, guideId },
    });
    if (!account) throw new NotFoundException('Payout account not found');

    await this.prisma.guide_payout_accounts.delete({ where: { id: accountId } });

    if (account.isDefault) {
      const next = await this.prisma.guide_payout_accounts.findFirst({
        where: { guideId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.guide_payout_accounts.update({
          where: { id: next.id },
          data: { isDefault: true, updatedAt: new Date() },
        });
      }
    }

    return { deleted: true };
  }

  async setDefaultForGuide(userId: string, accountId: string) {
    const guideId = await this.resolveGuideId(userId);
    const account = await this.prisma.guide_payout_accounts.findFirst({
      where: { id: accountId, guideId },
    });
    if (!account) throw new NotFoundException('Payout account not found');
    if (account.accountStatus !== PayoutAccountStatus.ACTIVE || !account.verified) {
      throw new BadRequestException('Only active verified accounts can be set as default');
    }

    await this.prisma.$transaction([
      this.prisma.guide_payout_accounts.updateMany({
        where: { guideId },
        data: { isDefault: false, updatedAt: new Date() },
      }),
      this.prisma.guide_payout_accounts.update({
        where: { id: accountId },
        data: { isDefault: true, updatedAt: new Date() },
      }),
    ]);

    return this.prisma.guide_payout_accounts.findUnique({ where: { id: accountId } });
  }

  async listPendingForAdmin() {
    return this.prisma.guide_payout_accounts.findMany({
      where: { accountStatus: PayoutAccountStatus.PENDING_VERIFICATION },
      include: {
        guides: {
          include: {
            users: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveAccount(adminId: string, accountId: string) {
    const account = await this.prisma.guide_payout_accounts.findUnique({
      where: { id: accountId },
      include: { guides: true },
    });
    if (!account) throw new NotFoundException('Payout account not found');

    const updated = await this.prisma.guide_payout_accounts.update({
      where: { id: accountId },
      data: {
        accountStatus: PayoutAccountStatus.ACTIVE,
        verified: true,
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null,
        updatedAt: new Date(),
      },
    });

    await this.notifications.notifyPayoutAccountApproved(
      account.guides.userId,
      account.provider,
    );

    this.audit.log({
      action: 'financial.payout_account.verified',
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      resourceType: 'guide_payout_account',
      resourceId: accountId,
      metadata: { guideId: account.guideId },
    });

    return updated;
  }

  async rejectAccount(adminId: string, accountId: string, reason: string) {
    const account = await this.prisma.guide_payout_accounts.findUnique({
      where: { id: accountId },
      include: { guides: true },
    });
    if (!account) throw new NotFoundException('Payout account not found');

    const now = new Date();
    const updated = await this.prisma.guide_payout_accounts.update({
      where: { id: accountId },
      data: {
        accountStatus: PayoutAccountStatus.REJECTED,
        verified: false,
        isDefault: false,
        rejectionReason: reason,
        rejectedBy: adminId,
        rejectedAt: now,
        updatedAt: now,
      },
    });

    await this.notifications.notifyPayoutAccountRejected(
      account.guides.userId,
      account.provider,
      reason,
    );

    this.audit.log({
      action: 'financial.payout_account.rejected',
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      resourceType: 'guide_payout_account',
      resourceId: accountId,
      metadata: { guideId: account.guideId, reason },
    });

    return updated;
  }

  async suspendAccount(adminId: string, accountId: string, reason?: string) {
    const account = await this.prisma.guide_payout_accounts.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Payout account not found');

    const updated = await this.prisma.guide_payout_accounts.update({
      where: { id: accountId },
      data: {
        accountStatus: PayoutAccountStatus.SUSPENDED,
        verified: false,
        isDefault: false,
        rejectionReason: reason ?? 'Suspended by admin',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.audit.log({
      action: 'financial.payout_account.suspended',
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      resourceType: 'guide_payout_account',
      resourceId: accountId,
      metadata: { guideId: account.guideId, reason },
    });

    return updated;
  }

  async assertGuideOwnership(userId: string, guideId: string): Promise<void> {
    const guide = await this.prisma.guides.findUnique({ where: { userId } });
    if (!guide || guide.id !== guideId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
