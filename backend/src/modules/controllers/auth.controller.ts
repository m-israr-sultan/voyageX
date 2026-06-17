import { Body, Controller, Post } from '@nestjs/common';
import { Headers } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterAgencyDto,
  RegisterGuideDto,
  RegisterTravelerDto,
  ResetPasswordDto,
  VerifyOtpDto
} from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register/traveler')
  registerTraveler(@Body() body: RegisterTravelerDto) { return this.auth.registerTraveler(body); }
  @Post('register/guide')
  registerGuide(@Body() body: RegisterGuideDto) { return this.auth.registerGuide(body); }
  @Post('register/agency')
  registerAgency(@Body() body: RegisterAgencyDto) { return this.auth.registerAgency(body); }
  @Post('login')
  login(@Body() body: LoginDto, @Headers('user-agent') userAgent?: string, @Headers('x-forwarded-for') ipAddress?: string) {
    return this.auth.login(body, { userAgent, ipAddress });
  }
  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) { return this.auth.verifyOtp(body.email, body.otp, body.purpose); }
  @Post('forgot-password')
  forgot(@Body() body: ForgotPasswordDto) { return this.auth.forgotPassword(body.email); }
  @Post('reset-password')
  reset(@Body() body: ResetPasswordDto) { return this.auth.resetPassword(body.email, body.otp, body.newPassword); }
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto, @Headers('user-agent') userAgent?: string, @Headers('x-forwarded-for') ipAddress?: string) {
    return this.auth.refresh(body.refreshToken, { userAgent, ipAddress });
  }
}
