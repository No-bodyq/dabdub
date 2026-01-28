import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache } from 'cache-manager';

/**
 * Interceptor for caching analytics responses
 * Automatically caches GET requests based on URL and query parameters
 */
@Injectable()
export class AnalyticsCacheInterceptor implements NestInterceptor {
  constructor(@Inject('CACHE_MANAGER') private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key from URL and query params
    const cacheKey = this.generateCacheKey(request);

    // Try to get from cache
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // If not in cache, execute request and cache the result
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, 600); // 10 minutes
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const url = request.url;
    const queryString = JSON.stringify(request.query);
    return `analytics:cache:${url}:${queryString}`;
  }
}
