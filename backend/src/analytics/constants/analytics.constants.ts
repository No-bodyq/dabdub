/**
 * Analytics Module Constants
 */

export const ANALYTICS_CONSTANTS = {
  // Cache TTL in seconds
  CACHE_TTL: 600, // 10 minutes

  // Query limits
  MAX_DATE_RANGE_DAYS: 365,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_TOP_CUSTOMERS: 10,

  // Performance thresholds
  DASHBOARD_LOAD_TIME_MS: 2000,
  QUERY_TIMEOUT_MS: 30000,

  // Report settings
  REPORT_EXPIRY_HOURS: 24,
  MAX_CONCURRENT_REPORTS: 5,

  // Date formats
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
} as const;

export const CACHE_KEYS = {
  DASHBOARD: (merchantId: string, start: number, end: number) =>
    `analytics:dashboard:${merchantId}:${start}:${end}`,
  REVENUE: (merchantId: string, start: number, end: number, interval: string) =>
    `analytics:revenue:${merchantId}:${start}:${end}:${interval}`,
  TRENDS: (merchantId: string, start: number, end: number, interval: string) =>
    `analytics:trends:${merchantId}:${start}:${end}:${interval}`,
  SETTLEMENTS: (merchantId: string, start: number, end: number) =>
    `analytics:settlements:${merchantId}:${start}:${end}`,
  NETWORKS: (merchantId: string, start: number, end: number) =>
    `analytics:networks:${merchantId}:${start}:${end}`,
  PERFORMANCE: (merchantId: string, start: number, end: number) =>
    `analytics:performance:${merchantId}:${start}:${end}`,
  CUSTOMERS: (merchantId: string, start: number, end: number) =>
    `analytics:customers:${merchantId}:${start}:${end}`,
} as const;

export const ERROR_MESSAGES = {
  INVALID_DATE_RANGE: 'End date must be after start date',
  DATE_RANGE_TOO_LARGE: `Date range cannot exceed ${ANALYTICS_CONSTANTS.MAX_DATE_RANGE_DAYS} days`,
  MERCHANT_NOT_FOUND: 'Merchant not found',
  REPORT_NOT_FOUND: 'Report not found',
  REPORT_GENERATION_FAILED: 'Report generation failed',
  INVALID_INTERVAL: 'Invalid time interval',
} as const;
