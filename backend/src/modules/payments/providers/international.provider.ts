/*
 * International Booking Provider
 *
 * International bookings (previously called "manual bookings") use
 * BANK_TRANSFER as their payment method.  The payment flow is identical
 * to the domestic bank transfer flow, except:
 *   - The booking is flagged as isInternational = true
 *   - An admin is assigned via the international bookings panel
 *   - The admin contacts the traveler via WhatsApp to arrange payment
 *
 * This provider is a thin wrapper around BankTransferProvider.
 * It exists only to allow provider-specific logging and future divergence.
 */
import { Injectable } from '@nestjs/common';
import { BankTransferProvider } from './bank-transfer.provider';

@Injectable()
export class InternationalProvider extends BankTransferProvider {}
