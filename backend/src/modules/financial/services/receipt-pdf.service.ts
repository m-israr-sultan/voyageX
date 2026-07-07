import { Injectable, Logger } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import type { ReceiptMetadata } from '../types/receipt-metadata.interface';

@Injectable()
export class ReceiptPdfService {
  private readonly logger = new Logger(ReceiptPdfService.name);
  private readonly receiptsDir = join(process.cwd(), 'uploads', 'receipts');

  ensureReceiptsDir(): void {
    if (!existsSync(this.receiptsDir)) {
      mkdirSync(this.receiptsDir, { recursive: true });
    }
  }

  async generatePdf(
    receiptNumber: string,
    metadata: ReceiptMetadata,
    verificationUrl: string,
    verificationToken: string,
  ): Promise<string> {
    this.ensureReceiptsDir();
    const filename = `${receiptNumber}.pdf`;
    const filePath = join(this.receiptsDir, filename);

    if (existsSync(filePath)) {
      return `receipts/${filename}`;
    }

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(22).fillColor('#008A1E').text('VoyageX', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#666').text('Pakistan Travel Marketplace', { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(16).fillColor('#000').text('Financial Receipt', { align: 'center' });
      doc.moveDown(1);

      const rows: Array<[string, string]> = [
        ['Receipt Number', receiptNumber],
        ['Invoice Number', metadata.voyagexReference],
        ['VoyageX Reference', metadata.voyagexReference],
        ['Status', metadata.status],
        ['Timestamp', metadata.timestamp],
        ['Currency', metadata.currency],
      ];

      if (metadata.bookingId) rows.push(['Booking ID', metadata.bookingId]);
      if (metadata.transactionId) rows.push(['Transaction ID', metadata.transactionId]);
      if (metadata.paymentMethod) rows.push(['Payment Method', metadata.paymentMethod]);
      if (metadata.provider) rows.push(['Provider', metadata.provider]);
      if (metadata.providerReference) rows.push(['Provider Reference', metadata.providerReference]);
      if (metadata.travelerName) rows.push(['Traveler', metadata.travelerName]);
      if (metadata.guideName) rows.push(['Guide', metadata.guideName]);
      if (metadata.agencyName) rows.push(['Agency', metadata.agencyName]);

      rows.push(['Gross Amount', `Rs ${metadata.grossAmount.toLocaleString()}`]);
      if (metadata.commissionAmount && metadata.commissionAmount > 0) {
        rows.push(['Commission', `Rs ${metadata.commissionAmount.toLocaleString()}`]);
      }
      rows.push(['Net Amount', `Rs ${metadata.netAmount.toLocaleString()}`]);
      if (metadata.taxes !== undefined) {
        rows.push(['Taxes', `Rs ${metadata.taxes.toLocaleString()}`]);
      }

      doc.fontSize(10).fillColor('#333');
      for (const [label, value] of rows) {
        doc.text(`${label}: ${value}`);
      }

      doc.moveDown(1.5);
      doc.fontSize(9).fillColor('#555').text('Verification', { underline: true });
      doc.text(`Token: ${verificationToken}`);
      doc.text(`URL: ${verificationUrl}`);

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999').text(
        'This is an electronically generated receipt. Verify authenticity at the URL above.',
        { align: 'center' },
      );

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    this.logger.log(`Receipt PDF generated: ${filePath}`);
    return `receipts/${filename}`;
  }
}
