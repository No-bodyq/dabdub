import { Module, Global, DynamicModule, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import Redis, { Cluster } from 'ioredis';
import cacheConfig from './cache.config';
import { CacheService } from './cache.service';
import { CacheMetricsService } from './cache-metrics.service';
import { CacheWarmingService } from './cache-warming.service';
import { CacheAsideInterceptor } from './cache-aside.interceptor';

@Global()
@Module({})
export class CacheModule {
  static forRoot(): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ConfigModule.forFeature(cacheConfig),
        NestCacheModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const config =
              configService.get<ReturnType<typeof cacheConfig>>('cache');

            if (!config) {
              throw new Error('Cache configuration not found');
            }

            const logger = new Logger('CacheModule');

            // Handle Redis cluster configuration
            if (config.cluster?.enabled) {
              const cluster = new Cluster(config.cluster.nodes, {
                ...config.cluster.options,
                // maxRetriesPerRequest removed as it is not in ClusterOptions
                enableReadyCheck: config.enableReadyCheck,
                enableOfflineQueue: config.enableOfflineQueue,
              });

              return {
                store: redisStore,
                host: config.cluster.nodes[0]?.host || 'localhost',
                port: config.cluster.nodes[0]?.port || 6379,
                ttl: config.defaultTtl * 1000, // Convert to milliseconds
                client: cluster,
              };
            }

            // Standard Redis configuration
            const redisClient = new Redis({
              host: config.host,
              port: config.port,
              password: config.password,
              db: config.db,
              tls: config.tls,
              // maxRetries removed as it is not in RedisOptions
              retryStrategy: (times) => Math.min(times * 50, 2000),
              enableReadyCheck: config.enableReadyCheck,
              maxRetriesPerRequest: config.maxRetriesPerRequest,
              lazyConnect: config.lazyConnect,
              enableOfflineQueue: config.enableOfflineQueue,
            });

            // Handle connection events
            redisClient.on('connect', () => {
              logger.log('Redis client connecting...');
            });

            redisClient.on('ready', () => {
              logger.log('Redis client ready');
            });

            redisClient.on('error', (error) => {
              logger.error('Redis client error:', error);
            });

            redisClient.on('close', () => {
              logger.log('Redis client connection closed');
            });

            return {
              store: redisStore,
              host: config.host,
              port: config.port,
              password: config.password,
              db: config.db,
              ttl: config.defaultTtl * 1000, // Convert to milliseconds
              client: redisClient,
            };
          },
          inject: [ConfigService],
        }),
      ],
      providers: [
        CacheService,
        CacheMetricsService,
        CacheWarmingService,
        CacheAsideInterceptor,
      ],
      exports: [
        CacheService,
        CacheMetricsService,
        CacheWarmingService,
        CacheAsideInterceptor,
        NestCacheModule,
      ],
    };
  }
}
