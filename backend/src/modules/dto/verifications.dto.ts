import { DocumentType, VerificationStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min
} from 'class-validator';

/**
 * fileUrl formats accepted:
 *   1. Legacy local path  — uploads/verifications/{ownerId}/...
 *   2. Current proxy path — /api/v1/images/{bucket}/{fileName}
 *      (returned by POST /upload/document, see images.service.ts uploadImage())
 * Ownership for (2) is enforced via the authenticated userId on the created
 * record, not the path itself, since Supabase-backed paths carry no owner
 * segment.
 */
export class UploadVerificationDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(uploads\/verifications\/[a-zA-Z0-9_-]+\/.+|\/api\/v1\/images\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+)$/,
    {
      message:
        'fileUrl must be in uploads/verifications/{ownerId}/... format or a valid /api/v1/images/{bucket}/{fileName} proxy path'
    }
  )
  fileUrl!: string;

  @IsString()
  @IsOptional()
  fileKey?: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsInt()
  @Min(0)
  fileSize!: number;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}

export class UpdateVerificationDocumentStatusDto {
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
