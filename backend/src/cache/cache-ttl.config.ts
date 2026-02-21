/**
 * Cache TTL (Time To Live) strategies for different data types
 * All values are in seconds
 */
export enum CacheTtl {
  // Short-lived data (1-5 minutes)
  SHORT = 60, // 1 minute
  VERY_SHORT = 30, // 30 seconds

  // Medium-lived data (5-30 minutes)
  MEDIUM = 300, // 5 minutes
  MEDIUM_LONG = 900, // 15 minutes

  // Long-lived data (30 minutes - 1 hour)
  LONG = 1800, // 30 minutes
  VERY_LONG = 3600, // 1 hour

  // Extended data (1-24 hours)
  EXTENDED = 7200, // 2 hours
  DAY = 86400, // 24 hours

  // Static/semi-static data (1-7 days)
  WEEK = 604800, // 7 days
}

/**
 * TTL configuration for different data types
 */
export const CacheTtlStrategies = {
  // User data
  USER_PROFILE: CacheTtl.LONG,
  USER_PREFERENCES: CacheTtl.VERY_LONG,
  USER_SESSION: CacheTtl.MEDIUM,

  // Payment data
  PAYMENT_REQUEST: CacheTtl.MEDIUM,
  PAYMENT_STATUS: CacheTtl.SHORT,
  PAYMENT_HISTORY: CacheTtl.MEDIUM_LONG,

  // Transaction data
  TRANSACTION: CacheTtl.MEDIUM,
  TRANSACTION_LIST: CacheTtl.MEDIUM,
  TRANSACTION_DETAILS: CacheTtl.LONG,

  // Rate limiting
  RATE_LIMIT: CacheTtl.VERY_SHORT,
  RATE_LIMIT_WINDOW: CacheTtl.SHORT,

  // Blockchain data
  BLOCKCHAIN_BALANCE: CacheTtl.SHORT,
  BLOCKCHAIN_TRANSACTION: CacheTtl.MEDIUM_LONG,
  BLOCKCHAIN_NETWORK_STATUS: CacheTtl.MEDIUM,

  // API responses
  API_RESPONSE: CacheTtl.MEDIUM,
  API_LIST: CacheTtl.MEDIUM,
  API_DETAIL: CacheTtl.LONG,

  // Configuration data
  CONFIG: CacheTtl.DAY,
  FEATURE_FLAGS: CacheTtl.MEDIUM_LONG,

  // Analytics
  ANALYTICS: CacheTtl.MEDIUM,
  METRICS: CacheTtl.SHORT,

  // Static content
  STATIC_CONTENT: CacheTtl.WEEK,
} as const;

export type CacheTtlStrategy = keyof typeof CacheTtlStrategies;
