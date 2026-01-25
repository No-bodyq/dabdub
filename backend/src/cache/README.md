# Redis Caching Layer

A comprehensive Redis caching implementation for the DabDub backend, providing high-performance caching with graceful fallback, metrics, and production-ready features.

## Features

- ✅ Redis connection with authentication support
- ✅ Redis cluster support for production
- ✅ Cache TTL strategies for different data types
- ✅ Cache key naming conventions
- ✅ Cache service wrapper with helper methods
- ✅ Cache invalidation strategies
- ✅ Cache-aside pattern implementation
- ✅ Cache metrics and monitoring (hit/miss counters)
- ✅ Graceful fallback when Redis is unavailable
- ✅ Cache warming strategies
- ✅ Comprehensive documentation

## Installation

The required dependencies are already added to `package.json`. Install them with:

```bash
npm install
```

## Configuration

Configure Redis connection via environment variables in your `.env` file:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
REDIS_DB=0  # Optional, defaults to 0
REDIS_TLS=false  # Set to true for TLS connections
REDIS_TLS_REJECT_UNAUTHORIZED=true  # TLS certificate validation

# Redis Cluster Configuration (for production)
REDIS_CLUSTER_ENABLED=false
REDIS_CLUSTER_NODES=localhost:6379,localhost:6380,localhost:6381

# Cache Configuration
CACHE_DEFAULT_TTL=3600  # Default TTL in seconds (1 hour)

# Redis Connection Options
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=100  # milliseconds
REDIS_ENABLE_READY_CHECK=true
REDIS_MAX_RETRIES_PER_REQUEST=3
REDIS_LAZY_CONNECT=false
REDIS_ENABLE_OFFLINE_QUEUE=true
```

## Usage

### Basic Usage

The `CacheService` is globally available and can be injected into any service:

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService, CacheKeyBuilder } from './cache';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: CacheService) {}

  async getUser(id: string) {
    const cacheKey = CacheKeyBuilder.user.profile(id);
    
    // Try to get from cache
    let user = await this.cacheService.get(cacheKey);
    
    if (!user) {
      // Cache miss - fetch from database
      user = await this.userRepository.findOne(id);
      
      // Store in cache
      await this.cacheService.set(cacheKey, user, {
        strategy: 'USER_PROFILE',
      });
    }
    
    return user;
  }
}
```

### Cache-Aside Pattern with Decorator

Use the `@CacheAside` decorator for automatic cache-aside pattern:

```typescript
import { Injectable } from '@nestjs/common';
import { CacheAside } from './cache';

@Injectable()
export class UserService {
  @CacheAside({
    key: (args) => CacheKeyBuilder.user.profile(args[0]),
    strategy: 'USER_PROFILE',
  })
  async getUser(id: string) {
    return this.userRepository.findOne(id);
  }
}
```

Don't forget to register the interceptor globally or in your module:

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheAsideInterceptor } from './cache';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheAsideInterceptor,
    },
  ],
})
export class AppModule {}
```

### Cache Key Naming

Use `CacheKeyBuilder` for consistent cache key naming:

```typescript
import { CacheKeyBuilder } from './cache';

// User keys
const userKey = CacheKeyBuilder.user.profile('123');
const sessionKey = CacheKeyBuilder.user.session('session-id');

// Payment keys
const paymentKey = CacheKeyBuilder.payment.request('payment-id');
const paymentHistoryKey = CacheKeyBuilder.payment.history('123', 1);

// Rate limiting keys
const rateLimitKey = CacheKeyBuilder.rateLimit.ip('192.168.1.1', '/api/users');

// Custom keys
const customKey = CacheKeyBuilder.build('custom', 'entity', 'id');
```

### TTL Strategies

Use predefined TTL strategies for different data types:

```typescript
import { CacheService, CacheTtlStrategies } from './cache';

// Using strategy
await this.cacheService.set(key, value, {
  strategy: 'USER_PROFILE', // Uses CacheTtl.LONG (30 minutes)
});

// Using custom TTL
await this.cacheService.set(key, value, {
  ttl: 600, // 10 minutes in seconds
});
```

Available TTL strategies:
- `USER_PROFILE`: 30 minutes
- `PAYMENT_REQUEST`: 5 minutes
- `TRANSACTION`: 5 minutes
- `RATE_LIMIT`: 30 seconds
- `BLOCKCHAIN_BALANCE`: 1 minute
- And more... (see `cache-ttl.config.ts`)

### Cache Invalidation

```typescript
// Invalidate single key
await this.cacheService.del(cacheKey);

// Invalidate by pattern
await this.cacheService.delPattern('dabdub:user:123:*');

// Invalidate namespace
await this.cacheService.invalidateNamespace('user');

// Invalidate entity
await this.cacheService.invalidate('user', '123');
```

### Cache Metrics

Monitor cache performance:

```typescript
import { CacheService, CacheMetricsService } from './cache';

@Injectable()
export class MetricsService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly metricsService: CacheMetricsService,
  ) {}

  getCacheMetrics() {
    return this.cacheService.getMetrics();
    // Returns: { hits, misses, sets, deletes, errors, hitRate }
  }
}
```

### Cache Warming

Register cache warming strategies:

```typescript
import { CacheWarmingService } from './cache';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly cacheWarmingService: CacheWarmingService) {}

  onModuleInit() {
    this.cacheWarmingService.registerStrategy({
      name: 'user-profiles',
      warm: async () => {
        // Warm frequently accessed user profiles
        const activeUsers = await this.getActiveUsers();
        for (const user of activeUsers) {
          await this.cacheService.set(
            CacheKeyBuilder.user.profile(user.id),
            user,
            { strategy: 'USER_PROFILE' },
          );
        }
      },
      interval: 3600000, // 1 hour
    });
  }
}
```

### Graceful Fallback

The cache service automatically handles Redis unavailability:

```typescript
// Check if cache is available
if (this.cacheService.isAvailable()) {
  // Cache is working
} else {
  // Cache is down, but application continues to work
  // All cache operations return undefined/null gracefully
}

// Check fallback mode
if (this.cacheService.isInFallbackMode()) {
  // Redis is unavailable, using fallback mode
}
```

## Best Practices

### 1. Cache Key Naming

Always use `CacheKeyBuilder` for consistent naming:
- ✅ Good: `CacheKeyBuilder.user.profile(userId)`
- ❌ Bad: `user-${userId}` or `user_profile_${userId}`

### 2. TTL Selection

Choose appropriate TTL based on data volatility:
- **Short TTL** (30s - 1min): Rate limits, real-time data
- **Medium TTL** (5-15min): User sessions, payment requests
- **Long TTL** (30min - 1hr): User profiles, configurations
- **Extended TTL** (hours - days): Static content, feature flags

### 3. Cache Invalidation

Invalidate cache when data changes:
```typescript
async updateUser(id: string, data: UpdateUserDto) {
  await this.userRepository.update(id, data);
  
  // Invalidate cache
  await this.cacheService.invalidate('user', id);
  
  // Or delete specific key
  await this.cacheService.del(CacheKeyBuilder.user.profile(id));
}
```

### 4. Cache-Aside Pattern

Use cache-aside for database queries:
```typescript
async getData(id: string) {
  return this.cacheService.getOrSet(
    CacheKeyBuilder.build('data', id),
    async () => {
      // This function is only called on cache miss
      return this.repository.findOne(id);
    },
    { strategy: 'API_DETAIL' },
  );
}
```

### 5. Error Handling

The cache service handles errors gracefully, but you can add additional error handling:

```typescript
try {
  const cached = await this.cacheService.get(key);
  if (cached) return cached;
} catch (error) {
  // Log error but continue without cache
  this.logger.error('Cache error', error);
}

// Continue with database query
return this.repository.findOne(id);
```

### 6. Monitoring

Regularly check cache metrics:
```typescript
// Log metrics periodically
setInterval(() => {
  const metrics = this.cacheService.getMetrics();
  this.logger.log(`Cache hit rate: ${(metrics.hitRate * 100).toFixed(2)}%`);
}, 60000); // Every minute
```

## Production Considerations

### Redis Cluster

For production, enable Redis cluster:

```bash
REDIS_CLUSTER_ENABLED=true
REDIS_CLUSTER_NODES=redis1:6379,redis2:6379,redis3:6379
```

### TLS/SSL

Enable TLS for secure connections:

```bash
REDIS_TLS=true
REDIS_TLS_REJECT_UNAUTHORIZED=true
```

### Connection Pooling

The implementation uses ioredis connection pooling automatically. For high-traffic applications, consider:

- Increasing `maxRetries`
- Adjusting `retryDelayOnFailover`
- Monitoring connection pool metrics

### Monitoring

Monitor these metrics:
- Cache hit rate (target: >80%)
- Cache errors
- Redis connection status
- Memory usage

## Testing

The cache service gracefully handles Redis unavailability, making it easy to test without Redis:

```typescript
// In tests, cache operations will return undefined
// but won't throw errors
const value = await cacheService.get('key');
expect(value).toBeUndefined();
```

For integration tests, use a test Redis instance or mock the cache service.

## Troubleshooting

### Redis Connection Issues

1. Check Redis is running: `redis-cli ping`
2. Verify connection settings in `.env`
3. Check firewall/network settings
4. Review logs for connection errors

### High Cache Miss Rate

1. Review TTL strategies - may be too short
2. Check cache invalidation - may be too aggressive
3. Monitor cache size - may need more memory
4. Review cache warming strategies

### Memory Issues

1. Monitor Redis memory usage
2. Adjust TTL values
3. Implement cache eviction policies
4. Consider Redis cluster for horizontal scaling

## Acceptance Criteria Validation

✅ **Redis connects successfully on startup**
- Connection is established and verified on module initialization
- Connection status is logged

✅ **Cache hit/miss metrics are available**
- `CacheMetricsService` tracks all cache operations
- Metrics include hits, misses, sets, deletes, errors, and hit rate

✅ **Application degrades gracefully if Redis is down**
- All cache operations return undefined/null instead of throwing
- Application continues to function normally
- Fallback mode is automatically enabled

✅ **Cache invalidation works correctly**
- Single key deletion
- Pattern-based deletion
- Namespace invalidation
- Entity-based invalidation

## Additional Resources

- [NestJS Cache Manager Documentation](https://docs.nestjs.com/techniques/caching)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
