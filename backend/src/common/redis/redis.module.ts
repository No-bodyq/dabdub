import { Global, Logger, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import Redis from 'ioredis';
import { GlobalConfigService } from '../../config/global-config.service';
import { RedisService } from './redis.service';
import { RedisHealthIndicator } from './redis.health';
import { REDIS_CLIENT } from './inject-redis.decorator';

const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [GlobalConfigService],
      useFactory: async (config: GlobalConfigService) => {
        const redisConfig = config.getRedisConfig();
        try {
          const store = await redisStore({
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password ?? undefined,
            db: redisConfig.db ?? 0,
            keyPrefix: redisConfig.keyPrefix ?? undefined,
            ttl: DEFAULT_TTL_MS,
          });
          await store.client.ping();
          Logger.log('Redis cache store connected', 'RedisModule');
          return {
            stores: store,
            ttl: DEFAULT_TTL_MS,
          };
        } catch (err) {
          Logger.warn(
            'Redis unavailable, using in-memory cache fallback',
            (err as Error)?.message ?? err,
            'RedisModule',
          );
          return {
            ttl: DEFAULT_TTL_MS,
          };
        }
      },
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [GlobalConfigService],
      useFactory: (config: GlobalConfigService): Redis => {
        const redisConfig = config.getRedisConfig();
        const client = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password ?? undefined,
          db: redisConfig.db ?? 0,
          keyPrefix: redisConfig.keyPrefix ?? undefined,
          retryStrategy: (times) => Math.min(times * 100, 3000),
          maxRetriesPerRequest: 3,
          enableOfflineQueue: true,
          connectTimeout: 10000,
          lazyConnect: true,
        });

        client.on('error', (err) =>
          Logger.error('Redis error', err, 'RedisModule'),
        );
        client.on('connect', () =>
          Logger.log('Redis connected', 'RedisModule'),
        );
        client.on('ready', () => Logger.log('Redis ready', 'RedisModule'));

        return client;
      },
    },
    RedisService,
    RedisHealthIndicator,
  ],
  exports: [REDIS_CLIENT, RedisService, CacheModule, RedisHealthIndicator],
})
export class RedisModule {}
