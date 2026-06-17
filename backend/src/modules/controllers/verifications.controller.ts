import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DocumentType, UserRole, VerificationStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  UpdateVerificationDocumentStatusDto,
  UploadVerificationDocumentDto
} from '../dto/verifications.dto';

const GUIDE_AGENCY_VERIFY_TYPES: DocumentType[] = [
  DocumentType.CNIC_FRONT,
  DocumentType.CNIC_BACK,
  DocumentType.RECOMMENDATION_LETTER,
  DocumentType.NOC
];

@Controller('verifications')
export class VerificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Post('documents')
  @Roles(UserRole.TRAVELER, UserRole.GUIDE, UserRole.AGENCY)
  async uploadDocument(
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() body: UploadVerificationDocumentDto
  ) {
    if (!body.fileUrl.includes(`/verifications/${user.id}/`)) {
      throw new BadRequestException(
        'fileUrl owner mismatch. Path must include current user id'
      );
    }

    if (
      user.role === UserRole.TRAVELER &&
      body.type !== DocumentType.CNIC_FRONT &&
      body.type !== DocumentType.CNIC_BACK
    ) {
      throw new BadRequestException(
        'Traveler verification only accepts CNIC_FRONT or CNIC_BACK'
      );
    }

    // If a rejected document of the same type exists, mark it superseded before creating new one
    await this.prisma.verification_documents.updateMany({
      where: {
        userId: user.id,
        type: body.type,
        status: VerificationStatus.REJECTED,
      },
      data: { status: 'SUPERSEDED' as unknown as VerificationStatus, updatedAt: new Date() },
    });

    const doc = await this.prisma.verification_documents.create({
      data: {
        id: randomUUID(),
        updatedAt: new Date(),
        userId: user.id,
        type: body.type,
        fileUrl: body.fileUrl,
        fileKey: body.fileKey,
        fileName: body.fileName,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        status: VerificationStatus.PENDING
      }
    });

    this.audit.log({
      action: 'verification.document_uploaded',
      actorId: user.id,
      actorRole: user.role,
      resourceType: 'verification_document',
      resourceId: doc.id,
      metadata: { documentType: body.type },
    });

    return doc;
  }

  @Get('my-documents')
  @Roles(UserRole.TRAVELER, UserRole.GUIDE, UserRole.AGENCY)
  async myDocuments(@CurrentUser() user: { id: string }) {
    return this.prisma.verification_documents.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('my-checklist')
  @Roles(UserRole.TRAVELER, UserRole.GUIDE, UserRole.AGENCY)
  async myChecklist(@CurrentUser() user: { id: string; role: UserRole }) {
    const docs = await this.prisma.verification_documents.findMany({
      where: {
        userId: user.id,
        status: { in: [VerificationStatus.PENDING, VerificationStatus.APPROVED] }
      }
    });
    const uploaded = new Set(docs.map((d) => d.type));

    if (user.role === UserRole.TRAVELER) {
      const required = [DocumentType.CNIC_FRONT, DocumentType.CNIC_BACK];
      return {
        required,
        missing: required.filter((d) => !uploaded.has(d))
      };
    }

    if (user.role === UserRole.GUIDE) {
      return {
        required: GUIDE_AGENCY_VERIFY_TYPES,
        optional: [DocumentType.CERTIFICATE],
        missing: GUIDE_AGENCY_VERIFY_TYPES.filter((d) => !uploaded.has(d))
      };
    }

    return {
      required: GUIDE_AGENCY_VERIFY_TYPES,
      missing: GUIDE_AGENCY_VERIFY_TYPES.filter((d) => !uploaded.has(d))
    };
  }

  @Get('admin/pending')
  @Roles(UserRole.ADMIN)
  async pending() {
    return this.prisma.verification_documents.findMany({
      where: { status: VerificationStatus.PENDING },
      include: {
        users: { select: { id: true, firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  @Patch('documents/:id/status')
  @Roles(UserRole.ADMIN)
  async updateDocumentStatus(
    @Param('id') id: string,
    @CurrentUser() admin: { id: string },
    @Body() body: UpdateVerificationDocumentStatusDto
  ) {
    if (body.status === VerificationStatus.REJECTED && !body.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting');
    }

    const doc = await this.prisma.verification_documents.update({
      where: { id },
      data: {
        status: body.status,
        adminNote:
          body.status === VerificationStatus.REJECTED
            ? body.rejectionReason
            : null,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
        updatedAt: new Date()
      },
      include: { users: true }
    });

    if (body.status === VerificationStatus.APPROVED && doc.users) {
      const u = doc.users;
      if (u.role === UserRole.GUIDE) {
        const approvedDocs = await this.prisma.verification_documents.findMany({
          where: {
            userId: doc.userId,
            status: VerificationStatus.APPROVED,
            type: { in: GUIDE_AGENCY_VERIFY_TYPES }
          }
        });
        const approved = new Set(approvedDocs.map((d) => d.type));
        const isVerified = GUIDE_AGENCY_VERIFY_TYPES.every((t) => approved.has(t));
        if (isVerified) {
          await this.prisma.guides.updateMany({
            where: { userId: doc.userId },
            data: { isVerified: true, updatedAt: new Date() }
          });
        }
      }

      if (u.role === UserRole.AGENCY) {
        const approvedDocs = await this.prisma.verification_documents.findMany({
          where: {
            userId: doc.userId,
            status: VerificationStatus.APPROVED,
            type: { in: GUIDE_AGENCY_VERIFY_TYPES }
          }
        });
        const approved = new Set(approvedDocs.map((d) => d.type));
        const isVerified = GUIDE_AGENCY_VERIFY_TYPES.every((t) => approved.has(t));
        if (isVerified) {
          await this.prisma.agencies.updateMany({
            where: { userId: doc.userId },
            data: { isVerified: true, updatedAt: new Date() }
          });
        }
      }

      this.audit.log({
        action: 'verification.document_approved',
        actorId: admin.id,
        actorRole: 'ADMIN',
        resourceType: 'verification_document',
        resourceId: id,
        metadata: { userId: doc.userId, documentType: doc.type, userRole: u.role },
      });
    }

    if (body.status === VerificationStatus.REJECTED) {
      this.audit.log({
        action: 'verification.document_rejected',
        actorId: admin.id,
        actorRole: 'ADMIN',
        resourceType: 'verification_document',
        resourceId: id,
        metadata: {
          userId: doc.userId,
          documentType: doc.type,
          rejectionReason: body.rejectionReason,
        },
      });
    }

    return doc;
  }
}
