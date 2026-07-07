import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ProviderStatementSource, ProviderStatementStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../common/services/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';

export type StatementLineInput = {
  providerReference: string;
  amount: number;
  currency?: string;
  transactionDate?: string;
  rawData?: Record<string, unknown>;
};

@Injectable()
export class ProviderStatementService {
  private readonly logger = new Logger(ProviderStatementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async importStatement(input: {
    provider: string;
    statementType: string;
    source: ProviderStatementSource;
    fileName?: string;
    periodStart?: Date;
    periodEnd?: Date;
    importedBy: string;
    lines: StatementLineInput[];
    metadata?: Record<string, unknown>;
  }) {
    const now = new Date();
    const statement = await this.prisma.provider_statements.create({
      data: {
        id: randomUUID(),
        provider: input.provider,
        statementType: input.statementType,
        source: input.source,
        fileName: input.fileName,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        status: ProviderStatementStatus.PROCESSING,
        importedBy: input.importedBy,
        totalRecords: input.lines.length,
        metadata: input.metadata as Prisma.InputJsonValue,
        updatedAt: now,
        lines: {
          create: input.lines.map((line) => ({
            id: randomUUID(),
            providerReference: line.providerReference,
            amount: line.amount,
            currency: line.currency ?? 'PKR',
            transactionDate: line.transactionDate ? new Date(line.transactionDate) : null,
            rawData: line.rawData as Prisma.InputJsonValue,
          })),
        },
      },
      include: { lines: true },
    });

    this.audit.log({
      action: 'financial.statement.imported',
      actorId: input.importedBy,
      resourceType: 'provider_statement',
      resourceId: statement.id,
      metadata: { provider: input.provider, lineCount: input.lines.length },
    });

    const matched = await this.matchStatementLines(statement.id);

    this.audit.log({
      action: 'financial.statement.reconciled',
      actorId: input.importedBy,
      resourceType: 'provider_statement',
      resourceId: statement.id,
      metadata: {
        matched: matched.matchedRecords,
        unmatched: matched.unmatchedRecords,
      },
    });

    return matched;
  }

  async matchStatementLines(statementId: string) {
    const statement = await this.prisma.provider_statements.findUnique({
      where: { id: statementId },
      include: { lines: true },
    });
    if (!statement) throw new NotFoundException('Statement not found');

    let matched = 0;
    let unmatched = 0;

    for (const line of statement.lines) {
      let matchStatus = 'UNMATCHED';
      let matchedResourceType: string | undefined;
      let matchedResourceId: string | undefined;

      if (statement.statementType === 'PAYMENT') {
        const payment = await this.prisma.payments.findFirst({
          where: { providerTransactionId: line.providerReference },
        });
        if (payment && Math.abs(payment.amount - line.amount) < 1) {
          matchStatus = 'MATCHED';
          matchedResourceType = 'payment';
          matchedResourceId = payment.id;
          matched++;
        } else {
          unmatched++;
        }
      } else if (statement.statementType === 'PAYOUT') {
        const payout = await this.prisma.guide_payouts.findFirst({
          where: { providerReference: line.providerReference },
        });
        if (payout && Math.abs(payout.netAmount - line.amount) < 1) {
          matchStatus = 'MATCHED';
          matchedResourceType = 'guide_payout';
          matchedResourceId = payout.id;
          matched++;
        } else {
          unmatched++;
        }
      } else {
        unmatched++;
      }

      await this.prisma.provider_statement_lines.update({
        where: { id: line.id },
        data: { matchStatus, matchedResourceType, matchedResourceId },
      });
    }

    return this.prisma.provider_statements.update({
      where: { id: statementId },
      data: {
        status: ProviderStatementStatus.RECONCILED,
        matchedRecords: matched,
        unmatchedRecords: unmatched,
        updatedAt: new Date(),
      },
      include: { lines: true },
    });
  }

  async listStatements(query: { page?: number; limit?: number; provider?: string }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.provider_statementsWhereInput = {};
    if (query.provider) where.provider = query.provider;

    const [items, total] = await Promise.all([
      this.prisma.provider_statements.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { lines: { take: 5 } },
      }),
      this.prisma.provider_statements.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
