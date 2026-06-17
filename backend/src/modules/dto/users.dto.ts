import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() avatar?: string;
}

export class ChangePasswordDto {
  @IsNotEmpty() @IsString() currentPassword!: string;
  @IsNotEmpty() @IsString() @MinLength(8) newPassword!: string;
}
