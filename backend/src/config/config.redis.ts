import { registerAs } from '@nestjs/config';
import { RedisConfig } from './interfaces/config.interface';

export const redisConfig = registerAs(
  'redis',
  (): RedisConfig => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'dabdub:',
  }),
);
