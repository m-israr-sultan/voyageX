import { IsOptional, IsString, MaxLength, IsArray, IsEnum } from 'class-validator';
import { Region } from '@prisma/client';

export class UpdateAgencyProfileDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsArray() galleryImages?: string[];
  @IsOptional() @IsEnum(Region) region?: Region;
}