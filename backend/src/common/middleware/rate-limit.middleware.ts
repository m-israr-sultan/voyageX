import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type RateLimitPolicy = { limit: number; windowMs: number };

/**
 * Per-route rate limiting policies.
 * More sensitive endpoints get tighter limits.
 */
const ROUTE_POLICIES: { prefix: string; policy: RateLimitPolicy }[] = [
  // Authentication — very tight
  { prefix: '/api/v1/auth/login',           policy: { limit: 10,  windowMs: 60_000 } },
  { prefix: '/api/v1/auth/register',        policy: { limit: 5,   windowMs: 60_000 } },
  { prefix: '/api/v1/auth/forgot-password', policy: { limit: 5,   windowMs: 60_000 } },
  { prefix: '/api/v1/auth/verify-otp',      policy: { limit: 10,  windowMs: 60_000 } },
  // Booking creation — moderate
  { prefix: '/api/v1/bookings',             policy: { limit: 20,  windowMs: 60_000 } },
  // Uploads — tight
  { prefix: '/api/v1/upload',               policy: { limit: 10,  windowMs: 60_000 } },
  // Messaging — generous
  { prefix: '/api/v1/messages',             policy: { limit: 60,  windowMs: 60_000 } },
  // Reports/disputes — tight
  { prefix: '/api/v1/reports',              policy: { limit: 10,  windowMs: 60_000 } },
];

const DEFAULT_POLICY: RateLimitPolicy = { limit: 100, windowMs: 60_000 };

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  // Map key: `${ip}:${policyPrefix}` → { count, resetTime }
  private readonly store = new Map<string, { count: number; resetTime: number }>();

  private getPolicy(url: string): RateLimitPolicy {
    for (const entry of ROUTE_POLICIES) {
      if (url.startsWith(entry.prefix)) return entry.policy;
    }
    return DEFAULT_POLICY;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const url = req.originalUrl || req.url || '';
    const policy = this.getPolicy(url);
    const key = `${ip}:${url.split('?')[0]}`;
    const now = Date.now();

    const record = this.store.get(key);
    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + policy.windowMs });
    } else {
      record.count++;
      if (record.count > policy.limit) {
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
    }
    next();
  }
}