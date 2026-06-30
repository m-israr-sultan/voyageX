import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  get nodeEnv(): string {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get frontendUrl(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true });
  }

  get jwtExpiresIn(): string {
    return this.config.get('JWT_EXPIRES_IN', { infer: true });
  }

  get jwtRefreshSecret(): string {
    return this.config.get('JWT_REFRESH_SECRET', { infer: true });
  }

  get jwtRefreshExpiresIn(): string {
    return this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
  }

  get redisHost(): string {
    return this.config.get('REDIS_HOST', { infer: true });
  }

  get redisPort(): number {
    return this.config.get('REDIS_PORT', { infer: true });
  }

  get redisPassword(): string | undefined {
    return this.config.get('REDIS_PASSWORD', { infer: true });
  }

  get mailHost(): string {
    return this.config.get('MAIL_HOST', { infer: true });
  }

  get mailPort(): number {
    return this.config.get('MAIL_PORT', { infer: true });
  }

  get mailUser(): string {
    return this.config.get('MAIL_USER', { infer: true });
  }

  get mailPass(): string {
    return this.config.get('MAIL_PASS', { infer: true });
  }

  get mailSecure(): boolean {
    return this.config.get('MAIL_SECURE', { infer: true });
  }

  get mailFrom(): string {
    return this.config.get('MAIL_FROM', { infer: true });
  }

  get isMailConfigured(): boolean {
    return Boolean(
      this.mailHost && this.mailUser && this.mailPass && this.mailFrom,
    );
  }

  get weatherApiKey(): string {
    return this.config.get('WEATHER_API_KEY', { infer: true }) ?? '';
  }

  get weatherBaseUrl(): string {
    return this.config.get('WEATHER_BASE_URL', { infer: true });
  }

  getCorsOrigins(): boolean | string | string[] {
    if (this.isProduction) {
      return this.frontendUrl
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    }
    return true;
  }
}