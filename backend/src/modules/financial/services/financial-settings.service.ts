import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PLATFORM_CONFIG } from '../../../common/config/platform.config';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { FINANCIAL_SETTING_DEFAULTS } from '../constants/financial-settings.defaults';

@Injectable()
export class FinancialSettingsService implements OnModuleInit {
  private readonly logger = new Logger(FinancialSettingsService.name);
  private cache = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaults();
    await this.refreshCache();
  }

  async seedDefaults(): Promise<void> {
    const now = new Date();
    for (const def of FINANCIAL_SETTING_DEFAULTS) {
      const existing = await this.prisma.financial_settings.findUnique({
        where: { key: def.key },
      });
      if (!existing) {
        await this.prisma.financial_settings.create({
          data: {
            id: randomUUID(),
            key: def.key,
            value: def.value,
            valueType: def.valueType,
            label: def.label,
            description: def.description,
            category: def.category,
            updatedAt: now,
          },
        });
      }
    }
  }

  async refreshCache(): Promise<void> {
    const settings = await this.prisma.financial_settings.findMany();
    this.cache.clear();
    for (const s of settings) {
      this.cache.set(s.key, s.value);
    }
    const envSandbox = process.env.FINANCIAL_SANDBOX_MODE;
    if (envSandbox !== undefined) {
      this.cache.set('sandboxMode', envSandbox === 'false' ? 'false' : 'true');
    }
  }

  getString(key: string, fallback = ''): string {
    return this.cache.get(key) ?? fallback;
  }

  getNumber(key: string, fallback: number): number {
    const raw = this.cache.get(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  getBoolean(key: string, fallback: boolean): boolean {
    const raw = this.cache.get(key);
    if (!raw) return fallback;
    return raw === 'true' || raw === '1';
  }

  getJson<T>(key: string, fallback: T): T {
    const raw = this.cache.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  getGuideCommissionRate(): number {
    if (!this.getBoolean('monetizationEnabled', PLATFORM_CONFIG.monetizationEnabled)) {
      const freeEnd = new Date(PLATFORM_CONFIG.launchDate);
      freeEnd.setMonth(freeEnd.getMonth() + PLATFORM_CONFIG.freePeriodMonths);
      if (new Date() < freeEnd) return 0;
    }
    return this.getNumber('guideCommissionRate', PLATFORM_CONFIG.guideCommissionRate);
  }

  getSandboxMode(): boolean {
    return this.getBoolean('sandboxMode', PLATFORM_CONFIG.sandboxMode);
  }

  getCurrency(): string {
    return this.getString('currency', PLATFORM_CONFIG.currency);
  }

  async listAll() {
    return this.prisma.financial_settings.findMany({ orderBy: { category: 'asc' } });
  }

  async updateSetting(key: string, value: string, adminId: string) {
    const updated = await this.prisma.financial_settings.update({
      where: { key },
      data: { value, updatedBy: adminId, updatedAt: new Date() },
    });
    this.cache.set(key, value);
    this.audit.log({
      action: 'financial.settings.updated',
      actorId: adminId,
      resourceType: 'financial_setting',
      resourceId: key,
      metadata: { value },
    });
    return updated;
  }
}
