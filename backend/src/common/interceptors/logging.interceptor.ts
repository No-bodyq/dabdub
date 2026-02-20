import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AppLogger } from '../logger/app-logger.service';
import { sanitizeForLog } from '../utils/sanitize-for-log.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest();
    const { method, url, ip, headers, body } = req;
    const requestId = (req as any).requestId as string | undefined;
    const startTime = Date.now();

    const sanitizedBody = body && typeof body === 'object' ? sanitizeForLog(body) : undefined;
    this.logger.log(
      `→ ${method} ${url} ${sanitizedBody ? `body=${JSON.stringify(sanitizedBody)}` : ''}`.trim(),
      'HTTP',
    );

    return next.handle().pipe(
      tap((data) => {
        const res = httpCtx.getResponse();
        const duration = Date.now() - startTime;
        const responseSize =
          data !== undefined && data !== null
            ? JSON.stringify(data).length
            : 0;
        this.logger.log(
          `← ${method} ${url} ${res.statusCode} ${duration}ms`,
          'HTTP',
        );
        if (requestId) {
          this.logger.debug(
            `requestId=${requestId} statusCode=${res.statusCode} duration=${duration}ms responseSize=${responseSize}`,
            'HTTP',
          );
        }
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `← ${method} ${url} ERROR ${duration}ms`,
          err?.stack,
          'HTTP',
        );
        if (requestId) {
          this.logger.debug(
            `requestId=${requestId} duration=${duration}ms error=${err?.message}`,
            'HTTP',
          );
        }
        throw err;
      }),
    );
  }
}
