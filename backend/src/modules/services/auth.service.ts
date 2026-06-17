import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Region, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { NORTHERN_REGIONS } from '../../common/constants/regions.constants';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegisterAgencyDto,
  RegisterGuideDto,
  RegisterTravelerDto
} from '../dto/auth.dto';
import { EmailService } from './email.service';
import { QueueService } from './queue.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
    private readonly queueService: QueueService
  ) {}

  private uid(): string {
    return randomUUID();
  }

  private ts(): Date {
    return new Date();
  }

  private randomOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private toSlug(value: string): string {
    return slugify(value, { lower: true, strict: true, trim: true });
  }

  private ensureNorthernRegion(region: Region): void {
    if (!NORTHERN_REGIONS.includes(region)) {
      throw new BadRequestException(
        'Region restricted to northern areas only for guides and destinations'
      );
    }
  }

  private async makeTokens(
    user: { id: string; role: UserRole; email: string },
    _context?: { userAgent?: string; ipAddress?: string }
  ) {
    const accessToken = await this.jwt.signAsync(
      { id: user.id, role: user.role, email: user.email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m'
      }
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' }
    );
    await this.prisma.refresh_tokens.create({
      data: {
        id: this.uid(),
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
    return { accessToken, refreshToken };
  }

  async registerTraveler(body: RegisterTravelerDto) {
    const hashed = await bcrypt.hash(body.password, 10);
    const now = this.ts();
    const user = await this.prisma.users.create({
      data: {
        id: this.uid(),
        updatedAt: now,
        email: body.email,
        password: hashed,
        firstName: body.firstName,
        lastName: body.lastName,
        role: UserRole.TRAVELER
      }
    });

    const code = this.randomOtp();
    await this.prisma.otps.create({
      data: {
        id: this.uid(),
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    try {
      await this.queueService.enqueueOtpEmail(body.email, code, 'EMAIL_VERIFICATION');
    } catch {
      await this.emailService.sendOtpEmail(body.email, code, 'EMAIL_VERIFICATION');
    }

    const tokens = await this.makeTokens(user);
    this.logger.log(
      JSON.stringify({
        event: 'auth.register',
        role: user.role,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
    );
    return tokens;
  }

  async registerGuide(body: RegisterGuideDto) {
    this.ensureNorthernRegion(body.region);
    const hashed = await bcrypt.hash(body.password, 10);
    const now = this.ts();
    const user = await this.prisma.users.create({
      data: {
        id: this.uid(),
        updatedAt: now,
        email: body.email,
        password: hashed,
        firstName: body.firstName,
        lastName: body.lastName,
        role: UserRole.GUIDE,
        guides: {
          create: {
            id: this.uid(),
            updatedAt: now,
            slug: this.toSlug(`${body.firstName} ${body.lastName}`),
            bio: body.bio,
            languages: body.languages ?? [],
            specialities: body.specialities ?? [],
            location: body.location,
            region: body.region
          }
        }
      }
    });

    const code = this.randomOtp();
    await this.prisma.otps.create({
      data: {
        id: this.uid(),
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    try {
      await this.queueService.enqueueOtpEmail(body.email, code, 'EMAIL_VERIFICATION');
    } catch {
      await this.emailService.sendOtpEmail(body.email, code, 'EMAIL_VERIFICATION');
    }

    const tokens = await this.makeTokens(user);
    this.logger.log(
      JSON.stringify({
        event: 'auth.register',
        role: user.role,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
    );
    return tokens;
  }

  async registerAgency(body: RegisterAgencyDto) {
    const hashed = await bcrypt.hash(body.password, 10);
    const now = this.ts();
    let user: Awaited<ReturnType<typeof this.prisma.users.create>>;
    try {
      user = await this.prisma.users.create({
        data: {
          id: this.uid(),
          updatedAt: now,
          email: body.email,
          password: hashed,
          firstName: body.firstName,
          lastName: body.lastName,
          role: UserRole.AGENCY,
          ...(body.phone !== undefined && { phone: body.phone }),
          agencies: {
            create: {
              id: this.uid(),
              updatedAt: now,
              slug: this.toSlug(body.agencyName),
              name: body.agencyName,
              description: body.description,
              city: body.city,
              country: body.country,
              website: body.website,
              ...(body.address !== undefined && { address: body.address }),
              ...(body.region !== undefined && { region: body.region }),
            }
          }
        }
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target: string[] = error?.meta?.target ?? [];
        if (target.includes('slug')) {
          throw new ConflictException('An agency with this name already exists. Please choose a different name.');
        }
        if (target.includes('email')) {
          throw new ConflictException('An account with this email already exists.');
        }
      }
      throw error;
    }

    const code = this.randomOtp();
    await this.prisma.otps.create({
      data: {
        id: this.uid(),
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    try {
      await this.queueService.enqueueOtpEmail(body.email, code, 'EMAIL_VERIFICATION');
    } catch {
      await this.emailService.sendOtpEmail(body.email, code, 'EMAIL_VERIFICATION');
    }

    const tokens = await this.makeTokens(user);
    this.logger.log(
      JSON.stringify({
        event: 'auth.register',
        role: user.role,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
    );
    return tokens;
  }

  async login(
    body: { email: string; password: string },
    context?: { userAgent?: string; ipAddress?: string }
  ) {
    const user = await this.prisma.users.findUnique({
      where: { email: body.email }
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.makeTokens(user, context);
    this.logger.log(
      JSON.stringify({
        event: 'auth.login',
        role: user.role,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
    );
    return { user, ...tokens };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const recent = await this.prisma.otps.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    });
    if (recent) {
      throw new BadRequestException('Please wait before requesting another OTP');
    }

    const code = this.randomOtp();
    await this.prisma.otps.create({
      data: {
        id: this.uid(),
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    try {
      await this.queueService.enqueueOtpEmail(email, code, 'RESET_PASSWORD');
    } catch {
      await this.emailService.sendOtpEmail(email, code, 'RESET_PASSWORD');
    }
    return { message: 'OTP generated' };
  }

  async verifyOtp(email: string, otp: string, _purpose = 'RESET_PASSWORD') {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    const row = await this.prisma.otps.findFirst({
      where: { userId: user.id, code: otp, isUsed: false },
      orderBy: { createdAt: 'desc' }
    });
    if (!row || row.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.prisma.otps.update({
      where: { id: row.id },
      data: { isUsed: true }
    });
    return { verified: true };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const row = await this.prisma.otps.findFirst({
      where: { userId: user.id, code: otp, isUsed: true },
      orderBy: { createdAt: 'desc' }
    });
    if (!row || row.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { email },
      data: { password: hash, updatedAt: this.ts() }
    });
    return { message: 'Password reset successful' };
  }

  async refresh(
    refreshToken: string,
    context?: { userAgent?: string; ipAddress?: string }
  ) {
    const tokenRow = await this.prisma.refresh_tokens.findUnique({
      where: { token: refreshToken }
    });
    if (!tokenRow || tokenRow.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const payload = this.jwt.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET
    }) as { sub: string };
    const user = await this.prisma.users.findUniqueOrThrow({
      where: { id: payload.sub }
    });
    await this.prisma.refresh_tokens.delete({ where: { id: tokenRow.id } });
    const tokens = await this.makeTokens(
      { id: user.id, role: user.role, email: user.email },
      context
    );
    this.logger.log(
      JSON.stringify({
        event: 'auth.refresh',
        role: user.role,
        userId: user.id,
        refreshTokenId: tokenRow.id,
        timestamp: new Date().toISOString()
      })
    );
    return tokens;
  }
}