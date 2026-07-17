import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common';
import { Observable, finalize } from 'rxjs';
import { recordApiLatency } from '../../modules/monitoring/api-latency.buffer';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const started = Date.now();

    const route =
      (req as any)?.route?.path ||
      (req as any)?.originalUrl ||
      (req as any)?.url;

    const requestId =
      res?.getHeader?.('x-request-id')?.toString?.() ?? undefined;

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Date.now() - started;
        const statusCode = res?.statusCode ?? 500;

        // Skip high-volume analytics ingestion from latency percentiles so
        // founder dashboards reflect "real" API work, not beacon noise.
        const path = typeof route === 'string' ? route : '';
        if (!path.includes('/analytics/')) {
          recordApiLatency(durationMs);
        }

        this.logger.log(
          JSON.stringify({
            event: 'http.request',
            requestId,
            method: req.method as string,
            route,
            timestamp: new Date().toISOString(),
            statusCode,
            durationMs
          })
        );
      })
    );
  }
}
