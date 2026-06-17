import { Prisma } from '@prisma/client';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePackageDto {
  @IsString() destinationId!: string;
  @IsString() title!: string;
  @IsString() description!: string;
  @Min(0) price!: number;
  @IsInt() @Min(1) durationDays!: number;
  @IsInt() @Min(1) maxGroupSize!: number;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsArray() includes?: string[];
  @IsOptional() @IsArray() excludes?: string[];
  @IsOptional() itinerary?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}

export class UpdatePackageDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(1) durationDays?: number;
  @IsOptional() @IsInt() @Min(1) maxGroupSize?: number;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsArray() includes?: string[];
  @IsOptional() @IsArray() excludes?: string[];
  @IsOptional() itinerary?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}
