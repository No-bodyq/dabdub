import { registerAs } from '@nestjs/config';
import { ApiConfig } from './interfaces/config.interface';

export const apiConfig = registerAs(
  'api',
  (): ApiConfig => ({
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
  }),
);
