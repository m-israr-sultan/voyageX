import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ReconciliationPeriod, UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { AuditService } from '../../common/services/audit.service';
import {
  FinancialMetricsQueryDto,
  ImportStatementDto,
  ReconciliationRunDto,
  RefundRejectDto,
  UpdateFinancialSettingDto,
  WebhookListQueryDto,
} from '../dto/financial.dto';
import { FinancialMetricsService } from '../financial/services/financial-metrics.service';
import { FinancialSettingsService } from '../financial/services/financial-settings.service';
import { ProviderStatementService } from '../financial/services/provider-statement.service';
import { ReconciliationService } from '../financial/services/reconciliation.service';
import { RefundOrchestrationService } from '../financial/services/refund-orchestration.service';
import { WebhookOperationsService } from '../financial/services/webhook-operations.service';

@Controller('admin/financial')
@Roles(UserRole.ADMIN)
export class AdminFinancialOpsController {
  constructor(
    private readonly metrics: FinancialMetricsService,
    private readonly reconciliation: ReconciliationService,
    private readonly statements: ProviderStatementService,
    private readonly settings: FinancialSettingsService,
    private readonly refunds: RefundOrchestrationService,
    private readonly webhooks: WebhookOperationsService,
    private readonly audit: AuditService,
  ) {}

  @Get('metrics')
  getMetrics(@Query() query: FinancialMetricsQueryDto) {
    return this.metrics.getDashboard({
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      provider: query.provider,
      guideId: query.guideId,
      agencyId: query.agencyId,
      status: query.status,
    });
  }

  @Get('metrics/export')
  async exportMetrics(
    @Query() query: FinancialMetricsQueryDto,
    @CurrentUser() admin: AuthUser,
    @Res() res: Response,
  ) {
    const result = await this.metrics.exportDashboard(
      {
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        provider: query.provider,
        guideId: query.guideId,
        agencyId: query.agencyId,
      },
      admin.id,
    );
    this.audit.log({
      action: 'financial.dashboard.exported',
      actorId: admin.id,
      resourceType: 'financial_dashboard',
      resourceId: 'export',
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  }

  @Get('reconciliation')
  listReconciliation(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.reconciliation.listReports({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('reconciliation/:id')
  getReconciliation(@Param('id') id: string) {
    return this.reconciliation.getReport(id);
  }

  @Post('reconciliation/run')
  runReconciliation(@CurrentUser() admin: AuthUser, @Body() body: ReconciliationRunDto) {
    const period = body.period ?? ReconciliationPeriod.MANUAL;
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : new Date();
    const periodStart = body.periodStart
      ? new Date(body.periodStart)
      : new Date(periodEnd.getTime() - 7 * 86_400_000);
    return this.reconciliation.runReport(period, periodStart, periodEnd, admin.id);
  }

  @Patch('reconciliation/issues/:id/resolve')
  resolveIssue(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    return this.reconciliation.resolveIssue(id, admin.id);
  }

  @Post('statements/import')
  importStatement(@CurrentUser() admin: AuthUser, @Body() body: ImportStatementDto) {
    return this.statements.importStatement({
      provider: body.provider,
      statementType: body.statementType,
      source: body.source,
      fileName: body.fileName,
      periodStart: body.periodStart ? new Date(body.periodStart) : undefined,
      periodEnd: body.periodEnd ? new Date(body.periodEnd) : undefined,
      importedBy: admin.id,
      lines: body.lines,
      metadata: body.metadata,
    });
  }

  @Get('statements')
  listStatements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('provider') provider?: string,
  ) {
    return this.statements.listStatements({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      provider,
    });
  }

  @Get('settings')
  listSettings() {
    return this.settings.listAll();
  }

  @Patch('settings/:key')
  updateSetting(
    @Param('key') key: string,
    @CurrentUser() admin: AuthUser,
    @Body() body: UpdateFinancialSettingDto,
  ) {
    return this.settings.updateSetting(key, body.value, admin.id);
  }

  @Get('webhooks')
  listWebhooks(@Query() query: WebhookListQueryDto) {
    return this.webhooks.listEvents({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 25,
      provider: query.provider,
      status: query.status,
      eventType: query.eventType,
      search: query.search,
    });
  }

  @Post('webhooks/:id/reprocess')
  reprocessWebhook(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    return this.webhooks.reprocessEvent(id, admin.id);
  }

  @Get('refunds')
  listRefunds(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.refunds.listRefunds({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Post('refunds/:id/approve')
  approveRefund(@Param('id') id: string, @CurrentUser() admin: AuthUser) {
    return this.refunds.approveRefund(admin.id, id);
  }

  @Post('refunds/:id/reject')
  rejectRefund(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() body: RefundRejectDto,
  ) {
    return this.refunds.rejectRefund(admin.id, id, body.reason);
  }
}
