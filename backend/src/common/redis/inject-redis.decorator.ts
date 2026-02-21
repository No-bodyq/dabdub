import { Inject } from '@nestjs/common';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Decorator to inject the Redis client in any module.
 * Use with RedisModule imported (or globally registered).
 *
 * @example
 * constructor(@InjectRedis() private readonly redis: Redis) {}
 */
export const InjectRedis = () => Inject(REDIS_CLIENT);
