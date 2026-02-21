import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    public httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, route } = request;

    // Normalize path to avoid high cardinality (optional, depends on needs)
    // Using route.path if available, otherwise fallback to url
    const path = route ? route.path : request.url;

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - start) / 1000;
        this.httpRequestDuration.labels(method, path, '200').observe(duration);
      }),
    );
  }
}
