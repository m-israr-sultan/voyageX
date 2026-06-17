import { Region } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateDestinationDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() city!: string;
  @IsOptional() @IsString() country?: string;
  @IsEnum(Region) region!: Region;
  @IsOptional() @IsString() image?: string;
}

export class UpdateDestinationDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsEnum(Region) region?: Region;
  @IsOptional() @IsString() image?: string;
}