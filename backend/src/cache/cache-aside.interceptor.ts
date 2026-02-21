import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CACHE_ASIDE_KEY, CacheAsideOptions } from './cache-aside.decorator';
import { CacheKeyBuilder } from './cache-key-builder';

@Injectable()
export class CacheAsideInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const options = this.reflector.get<CacheAsideOptions>(
      CACHE_ASIDE_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const args = context.getArgs();
    const methodArgs = args.slice(1); // Skip 'this' context

    // Build cache key
    let cacheKey: string;
    if (typeof options.key === 'function') {
      cacheKey = options.key(methodArgs);
    } else if (options.key) {
      cacheKey = options.key;
    } else {
      // Default key generation
      const className = context.getClass().name;
      const methodName = context.getHandler().name;
      cacheKey = CacheKeyBuilder.build(
        options.namespace || 'method',
        className,
        methodName,
        JSON.stringify(methodArgs),
      );
    }

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey, {
      strategy: options.strategy,
      skipMetrics: false,
    });

    if (cached !== undefined && cached !== null) {
      return of(cached);
    }

    // If not cached, execute method and cache result
    return next.handle().pipe(
      tap(async (data) => {
        if (data !== undefined && data !== null) {
          await this.cacheService.set(cacheKey, data, {
            ttl: options.ttl,
            strategy: options.strategy,
          });
        }
      }),
    );
  }
}
