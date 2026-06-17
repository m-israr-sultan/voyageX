import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
  IsBoolean,
  IsUUID,
} from 'class-validator';

// Re-export canonical payment DTOs so controllers that used to import from
// here can continue to work with a single-line change.
export { InitiatePaymentDto } from './payment-initiation.dto';
export { AgencySubscriptionPaymentDto } from './subscription-payment.dto';

export class CreateBookingDto {
  @IsOptional() @IsUUID() packageId?: string;
  @IsOptional() @IsUUID() guideId?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsOptional() @IsInt() @Min(1) @Max(50) groupSize?: number;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsBoolean() isInternational?: boolean;
  @IsOptional() @IsString() @MaxLength(20) whatsappNumber?: string;
}

export class CalculatePriceDto {
  @IsOptional() @IsUUID() packageId?: string;
  @IsOptional() @IsUUID() guideId?: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsInt() @Min(1) @Max(50) groupSize!: number;
  @IsOptional() @IsBoolean() isInternational?: boolean;
}

export class DisputeDto {
  @IsNotEmpty() @IsString() @MaxLength(200) reason!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}

// ============================================================
// International Booking DTOs (renamed from "Manual Booking")
// These handle international traveler bookings that go through
// the admin-assisted bank-transfer workflow.
// ============================================================

export class AssignInternationalBookingDto {
  @IsNotEmpty() @IsUUID() bookingId!: string;
  @IsOptional() @IsString() @MaxLength(20) whatsappId?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

/** @deprecated Alias kept for compatibility during rename transition */
export class AssignManualBookingDto extends AssignInternationalBookingDto {}

export class MarkInternationalBookingPaidDto {
  @IsNotEmpty() @IsUUID() bookingId!: string;
  @IsNotEmpty() @IsString() @MaxLength(100) transactionId!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

/** @deprecated Alias kept for compatibility during rename transition */
export class MarkManualBookingPaidDto extends MarkInternationalBookingPaidDto {}

export class AssignGuideToInternationalBookingDto {
  @IsNotEmpty() @IsUUID() bookingId!: string;
  @IsNotEmpty() @IsUUID() guideId!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

/** @deprecated Alias kept for compatibility during rename transition */
export class AssignGuideToManualBookingDto extends AssignGuideToInternationalBookingDto {}

// Commission system planned for future phase. Do not activate.
export class AgencyCommissionPaymentDto {
  @IsNotEmpty() @IsUUID() bookingId!: string;
  @IsNotEmpty() @IsString() @MaxLength(100) transactionId!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
