export interface ReceiptMetadata {
  status: string;
  currency: string;
  paymentMethod?: string;
  provider?: string;
  providerReference?: string;
  voyagexReference: string;
  transactionId?: string;
  bookingId?: string;
  grossAmount: number;
  commissionAmount?: number;
  netAmount: number;
  taxes?: number;
  travelerName?: string;
  guideName?: string;
  agencyName?: string;
  timestamp: string;
}
