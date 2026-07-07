import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PayoutProvider, ProviderStatementSource, ReconciliationPeriod } from '@prisma/client';

export class CreateGuidePayoutAccountDto {
  @IsEnum(PayoutProvider)
  provider!: PayoutProvider;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  accountTitle!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(34)
  iban?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  bankName?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateGuidePayoutAccountDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  accountTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(34)
  iban?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  bankName?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class RejectPayoutAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class PayoutListQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class FinancialListQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class FinancialMetricsQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  guideId?: string;

  @IsOptional()
  @IsString()
  agencyId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ReconciliationRunDto {
  @IsOptional()
  @IsEnum(ReconciliationPeriod)
  period?: ReconciliationPeriod;

  @IsOptional()
  @IsString()
  periodStart?: string;

  @IsOptional()
  @IsString()
  periodEnd?: string;
}

export class StatementLineDto {
  @IsString()
  @IsNotEmpty()
  providerReference!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;
}

export class ImportStatementDto {
  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsString()
  @IsNotEmpty()
  statementType!: string;

  @IsEnum(ProviderStatementSource)
  source!: ProviderStatementSource;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  periodStart?: string;

  @IsOptional()
  @IsString()
  periodEnd?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatementLineDto)
  lines!: StatementLineDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateFinancialSettingDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class WebhookListQueryDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class RefundRejectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
