/**
 * DTO for agency subscription payments.
 *
 * NOTE: The subscription amount is NOT accepted from the frontend.
 * Amount is always PLATFORM_CONFIG.agencySubscriptionAmount (Rs 10,000)
 * and is derived from config at the service layer.
 */
import { PaymentMethod } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PROOF_URL_PATTERN, PROOF_URL_MESSAGE } from '../../common/constants/proof-url.pattern';

export class AgencySubscriptionPaymentDto {
  /** Exactly one of the four permitted payment methods. */
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  /**
   * EasyPaisa / JazzCash: registered mobile number of the account holder.
   */
  @IsString()
  @MaxLength(20)
  @IsOptional()
  mobileNumber?: string;

  /**
   * Card only — sandbox token or production gateway token.
   * Raw card data must NEVER appear here.
   */
  @IsString()
  @IsOptional()
  cardToken?: string;

  /**
   * Bank Transfer only — bank reference number from the receipt.
   */
  @IsString()
  @MaxLength(100)
  @IsOptional()
  bankReference?: string;

  /**
   * Bank Transfer only — URL or backend proxy path of the uploaded payment
   * proof screenshot (see PROOF_URL_PATTERN for accepted formats).
   */
  @IsString()
  @Matches(PROOF_URL_PATTERN, { message: PROOF_URL_MESSAGE })
  @IsOptional()
  proofUrl?: string;
}
