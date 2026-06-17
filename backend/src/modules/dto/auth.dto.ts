import { Region } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';

export class RegisterTravelerDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
}

export class RegisterGuideDto extends RegisterTravelerDto {
  @IsOptional() @IsString() bio?: string;
  @IsArray() languages!: string[];
  @IsArray() specialities!: string[];
  @IsOptional() @IsString() location?: string;
  @IsEnum(Region) region!: Region;
}

export class RegisterAgencyDto extends RegisterTravelerDto {
  @IsString() agencyName!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsEnum(Region) region?: Region;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

export class VerifyOtpDto {
  @IsEmail() email!: string;
  @Matches(/^\d{6}$/) otp!: string;
  @IsOptional() @IsString() purpose?: string;
}

export class ForgotPasswordDto {
  @IsEmail() email!: string;
}

export class ResetPasswordDto {
  @IsEmail() email!: string;
  @Matches(/^\d{6}$/) otp!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

export class RefreshTokenDto {
  @IsString() refreshToken!: string;
}
