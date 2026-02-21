import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to set custom cache key prefix for analytics endpoints
 */
export const CACHE_KEY_METADATA = 'analytics:cache:key';

export const CacheKey = (prefix: string) =>
  SetMetadata(CACHE_KEY_METADATA, prefix);
