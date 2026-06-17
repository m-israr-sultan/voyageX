/**
 * Canonical payment initiation DTO.
 * Both BookingsController and PaymentsController import from here.
 * There is ONE source of truth for allowed payment methods:
 * the Prisma PaymentMethod enum.
 */
import { PaymentMethod } from '@prisma/client';
import {
  IsEnum,
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class InitiatePaymentDto {
  /** UUID of the booking being paid for. */
  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;

  /** Exactly one of the four permitted payment methods. */
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  /**
   * Amount submitted by the frontend.
   * NOTE: This value is verified server-side against the booking's
   * calculated cost. Requests where |submitted - expected| > 1 PKR
   * are rejected with 400. (ADD-3 amount integrity check)
   */
  @IsNumber()
  @Min(1)
  amount!: number;

  /**
   * EasyPaisa / JazzCash: registered mobile number of the account holder.
   * Required when paymentMethod is EASYPAISA or JAZZCASH.
   */
  @IsString()
  @MaxLength(20)
  @IsOptional()
  mobileNumber?: string;

  /**
   * Card method only — tokenised reference from the card gateway SDK.
   * NEVER store raw card data (PAN, CVV, expiry).
   *
   * Sandbox: any non-empty string is accepted.
   * Production: replace with real gateway token (Stripe PaymentIntent,
   *   HBL PayConnect token, 1Link token, etc.)
   *
   * CARD TOKENISATION — PRODUCTION REQUIREMENT
   * Raw card data must NEVER reach VoyageX servers (PCI DSS).
   * Before go-live: replace the sandbox token input in PaymentModal
   * with the payment gateway's hosted SDK (Stripe.js CardElement,
   * HBL hosted fields, or 1Link hosted fields).
   */
  @IsString()
  @IsOptional()
  cardToken?: string;

  /**
   * Bank Transfer only — reference number visible on the traveler's bank receipt.
   */
  @IsString()
  @MaxLength(100)
  @IsOptional()
  bankReference?: string;

  /**
   * Bank Transfer only — URL of the uploaded proof screenshot.
   * Admin reviews this before approving the payment.
   */
  @IsUrl()
  @IsOptional()
  proofUrl?: string;
}
