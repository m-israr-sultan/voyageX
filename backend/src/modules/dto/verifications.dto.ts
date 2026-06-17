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

export class UploadVerificationDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  @IsNotEmpty()
  @Matches(/^uploads\/verifications\/[a-zA-Z0-9_-]+\/.+$/, {
    message: 'fileUrl must be in uploads/verifications/{ownerId}/... format'
  })
  fileUrl!: string;

  @IsString()
  @IsNotEmpty()
  fileKey!: string;

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
