import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { EasypaisaPayoutGateway } from './providers/easypaisa-payout.gateway';
import { JazzcashPayoutGateway } from './providers/jazzcash-payout.gateway';
import { BankPayoutGateway } from './providers/bank-payout.gateway';
import { PayoutGatewayFactory } from './providers/payout-gateway.factory';
import { FinancialReferenceService } from './services/financial-reference.service';
import { FinancialValidationService } from './services/financial-validation.service';
import { GuidePayoutAccountService } from './services/guide-payout-account.service';
import { PayoutOrchestrationService } from './services/payout-orchestration.service';
import { PayoutRetrySchedulerService } from './services/payout-retry-scheduler.service';
import { WebhookEventService } from './services/webhook-event.service';
import { LedgerService } from './services/ledger.service';
import { ReceiptPdfService } from './services/receipt-pdf.service';
import { ReceiptService } from './services/receipt.service';
import { FinancialCompletionService } from './services/financial-completion.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { PayoutWebhookService } from './services/payout-webhook.service';
import { SubscriptionWebhookService } from './services/subscription-webhook.service';
import { FinancialSettingsService } from './services/financial-settings.service';
import { GatewayConfigService } from './services/gateway-config.service';
import { ReconciliationService } from './services/reconciliation.service';
import { ProviderStatementService } from './services/provider-statement.service';
import { RefundOrchestrationService } from './services/refund-orchestration.service';
import { FinancialMetricsService } from './services/financial-metrics.service';
import { WebhookOperationsService } from './services/webhook-operations.service';
import { ReconciliationSchedulerService } from './services/reconciliation-scheduler.service';
import { WebhookRecoverySchedulerService } from './services/webhook-recovery-scheduler.service';
import { NotificationService } from '../services/notification.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    FinancialReferenceService,
    FinancialValidationService,
    GuidePayoutAccountService,
    PayoutOrchestrationService,
    PayoutRetrySchedulerService,
    WebhookEventService,
    LedgerService,
    ReceiptPdfService,
    ReceiptService,
    FinancialCompletionService,
    PaymentWebhookService,
    PayoutWebhookService,
    SubscriptionWebhookService,
    FinancialSettingsService,
    GatewayConfigService,
    ReconciliationService,
    ProviderStatementService,
    RefundOrchestrationService,
    FinancialMetricsService,
    WebhookOperationsService,
    ReconciliationSchedulerService,
    WebhookRecoverySchedulerService,
    EasypaisaPayoutGateway,
    JazzcashPayoutGateway,
    BankPayoutGateway,
    PayoutGatewayFactory,
    NotificationService,
    AuditService,
  ],
  exports: [
    FinancialReferenceService,
    FinancialValidationService,
    GuidePayoutAccountService,
    PayoutOrchestrationService,
    PayoutGatewayFactory,
    FinancialCompletionService,
    PaymentWebhookService,
    PayoutWebhookService,
    SubscriptionWebhookService,
    ReceiptService,
    LedgerService,
    FinancialSettingsService,
    GatewayConfigService,
    ReconciliationService,
    ProviderStatementService,
    RefundOrchestrationService,
    FinancialMetricsService,
    WebhookOperationsService,
    WebhookEventService,
  ],
})
export class FinancialModule {}
