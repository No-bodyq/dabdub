# Webhook Delivery Monitoring and Management System

This comprehensive webhook system provides robust delivery monitoring, retry mechanisms, health tracking, and management capabilities for webhook endpoints.

## Features

### 🔍 **Monitoring & Analytics**
- Real-time delivery tracking with detailed logs
- Comprehensive analytics with success rates, response times, and error distribution
- Performance metrics including P95/P99 response times
- Daily delivery trends and historical analysis
- Health status monitoring with automatic alerting

### 🔄 **Retry Management**
- Automatic retry with exponential backoff
- Manual retry for individual deliveries
- Bulk retry operations for multiple failed deliveries
- Configurable retry policies per webhook
- Retry scheduling based on failure patterns

### 🧪 **Testing & Validation**
- Endpoint connectivity testing
- Webhook validation with recommendations
- Test history tracking
- Custom payload testing
- Signature verification testing

### 📊 **Dashboard & Reporting**
- Real-time dashboard with system overview
- Health score calculation with contributing factors
- Alert generation for critical issues
- Performance rankings and slow endpoint identification
- Recent activity monitoring

### 🛡️ **Health Monitoring**
- Automatic health checks every 5 minutes
- Webhook status classification (healthy, degraded, unhealthy, disabled)
- Consecutive failure tracking
- Automatic disabling of problematic webhooks
- Health recommendations and issue detection

## API Endpoints

### Core Webhook Management
```
POST   /api/v1/webhooks                    # Create webhook
GET    /api/v1/webhooks                    # List webhooks
GET    /api/v1/webhooks/:id                # Get webhook details
PUT    /api/v1/webhooks/:id                # Update webhook
DELETE /api/v1/webhooks/:id                # Delete webhook
```

### Monitoring & Analytics
```
GET    /api/v1/webhooks/:id/deliveries     # Get delivery logs (paginated)
GET    /api/v1/webhooks/:id/analytics      # Get webhook analytics
GET    /api/v1/webhooks/:id/health         # Get health status
GET    /api/v1/webhooks/:id/trends         # Get delivery trends
GET    /api/v1/webhooks/health/overview    # Get all webhooks health
GET    /api/v1/webhooks/failed-deliveries  # Get failed deliveries
```

### Retry Operations
```
POST   /api/v1/webhooks/:id/retry/:deliveryId    # Retry specific delivery
POST   /api/v1/webhooks/:id/retry/bulk           # Bulk retry deliveries
POST   /api/v1/webhooks/:id/retry/all-failed     # Retry all failed deliveries
GET    /api/v1/webhooks/:id/retryable            # Get retryable deliveries
```

### Testing & Validation
```
POST   /api/v1/webhooks/:id/test           # Test webhook endpoint
POST   /api/v1/webhooks/:id/validate       # Validate webhook configuration
GET    /api/v1/webhooks/:id/test-history   # Get test history
```

### Dashboard
```
GET    /api/v1/webhooks/dashboard/metrics       # Get dashboard metrics
GET    /api/v1/webhooks/dashboard/status-summary # Get status summary
GET    /api/v1/webhooks/dashboard/health-score   # Get system health score
```

## Data Models

### WebhookConfiguration
```typescript
{
  id: string;
  merchantId: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  headers?: Record<string, string>;
  consecutiveFailures: number;
  isActive: boolean;
  failureCount: number;
  maxFailureCount: number;
  maxConsecutiveFailures: number;
  lastDeliveredAt?: Date;
  lastFailureAt?: Date;
  disabledAt?: Date;
  disabledReason?: string;
  maxRetries: number;
  batchEnabled: boolean;
  batchMaxSize: number;
  batchWindowMs: number;
  retryDelay: number;
  timeout: number;
}
```

### WebhookDeliveryLog
```typescript
{
  id: string;
  webhookConfigId: string;
  merchantId: string;
  paymentRequestId?: string;
  event: string;
  payload: any;
  status: WebhookDeliveryStatus;
  attemptNumber: number;
  maxAttempts: number;
  responseTimeMs?: number;
  httpStatusCode?: number;
  errorMessage?: string;
  requestHeaders?: any;
  requestBody?: string;
  responseHeaders?: any;
  responseBody?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  nextRetryAt?: Date;
  retentionDays: number;
  retentionUntil?: Date;
  debugInfo?: any;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
}
```

## Usage Examples

### Creating a Webhook
```typescript
const webhook = await webhookService.create('merchant-id', {
  url: 'https://api.merchant.com/webhooks',
  events: [
    WebhookEvent.PAYMENT_REQUEST_CREATED,
    WebhookEvent.PAYMENT_REQUEST_COMPLETED
  ],
  isActive: true
});
```

### Getting Analytics
```typescript
const analytics = await monitoringService.getWebhookAnalytics(
  'webhook-id',
  new Date('2026-01-01'),
  new Date('2026-01-31')
);

console.log(`Success rate: ${analytics.successRate}%`);
console.log(`Average response time: ${analytics.averageResponseTime}ms`);
```

### Bulk Retry Failed Deliveries
```typescript
const result = await retryService.bulkRetryDeliveries('webhook-id', {
  deliveryIds: ['delivery-1', 'delivery-2', 'delivery-3'],
  reason: 'Endpoint was temporarily down'
});

console.log(`Queued: ${result.summary.queued}, Failed: ${result.summary.failed}`);
```

### Testing Webhook Endpoint
```typescript
const testResult = await testingService.testWebhookEndpoint('webhook-id', {
  event: 'test.custom',
  data: { message: 'Custom test payload' }
});

console.log(`Test ${testResult.status}: ${testResult.responseTimeMs}ms`);
```

### Getting Dashboard Metrics
```typescript
const metrics = await dashboardService.getDashboardMetrics();

console.log(`Total webhooks: ${metrics.overview.totalWebhooks}`);
console.log(`Success rate: ${metrics.overview.overallSuccessRate24h}%`);
console.log(`Active alerts: ${metrics.alerts.length}`);
```

## Configuration

### Environment Variables
```bash
# Webhook delivery settings
WEBHOOK_DEFAULT_TIMEOUT=5000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=1000
WEBHOOK_BATCH_MAX_SIZE=20
WEBHOOK_BATCH_WINDOW_MS=2000

# Health monitoring
WEBHOOK_HEALTH_CHECK_INTERVAL=300000  # 5 minutes
WEBHOOK_MAX_CONSECUTIVE_FAILURES=5
WEBHOOK_MAX_FAILURE_COUNT=50

# Retention settings
WEBHOOK_LOG_RETENTION_DAYS=30
WEBHOOK_LOG_CLEANUP_INTERVAL=86400000  # 24 hours
```

### Webhook Configuration Options
```typescript
{
  maxRetries: 3,              // Maximum retry attempts
  retryDelay: 1000,           // Base delay between retries (ms)
  timeout: 5000,              // Request timeout (ms)
  maxConsecutiveFailures: 5,  // Auto-disable threshold
  maxFailureCount: 50,        // Total failure threshold
  batchEnabled: false,        // Enable batch delivery
  batchMaxSize: 20,           // Maximum events per batch
  batchWindowMs: 2000,        // Batch collection window
}
```

## Health Status Classification

### Healthy
- Success rate ≥ 95% in last 24h
- Consecutive failures < 3
- Webhook is active

### Degraded
- Success rate ≥ 85% in last 24h
- Consecutive failures < 5
- Webhook is active

### Unhealthy
- Success rate < 85% in last 24h
- Consecutive failures ≥ 5
- Webhook is active but problematic

### Disabled
- Webhook is manually disabled
- Auto-disabled due to excessive failures

## Monitoring & Alerting

### Automatic Monitoring
- Health checks every 5 minutes
- Automatic retry processing every minute
- Hourly health reports
- Daily log cleanup

### Alert Types
- **High Failure Rate**: Success rate drops below threshold
- **Slow Response**: Average response time exceeds limits
- **Webhook Down**: Consecutive failures exceed threshold
- **Consecutive Failures**: Multiple sequential delivery failures

### Performance Metrics
- Success rate (overall and per webhook)
- Response time percentiles (P50, P95, P99)
- Error distribution by HTTP status code
- Delivery volume trends
- Endpoint availability

## Best Practices

### Webhook Endpoint Implementation
1. Return HTTP 200 for successful processing
2. Respond within 5 seconds
3. Implement idempotency for duplicate deliveries
4. Validate webhook signatures
5. Log webhook events for debugging

### Configuration Recommendations
1. Set appropriate timeout values (5-10 seconds)
2. Configure webhook secrets for security
3. Use HTTPS endpoints only
4. Set reasonable retry limits
5. Monitor webhook health regularly

### Troubleshooting
1. Check webhook endpoint logs for errors
2. Verify endpoint URL accessibility
3. Validate webhook signature implementation
4. Monitor response times and optimize if needed
5. Use test endpoint to verify configuration

## Security Considerations

### Signature Verification
All webhook payloads are signed using HMAC-SHA256:
```
X-Dabdub-Signature: t=timestamp,v1=signature
```

### Headers
Standard headers included in all webhook requests:
- `Content-Type: application/json`
- `User-Agent: Dabdub-Webhook/1.0`
- `X-Dabdub-Event: event_name`
- `X-Dabdub-Delivery: delivery_id`
- `X-Dabdub-Signature: signature` (if secret configured)

### Recommendations
1. Always use HTTPS endpoints
2. Configure webhook secrets
3. Validate signatures on your endpoint
4. Implement rate limiting on your webhook endpoint
5. Log and monitor webhook activity

## Maintenance

### Automatic Cleanup
- Delivery logs are automatically cleaned up based on retention settings
- Default retention: 30 days
- Configurable per webhook or globally

### Manual Operations
- Bulk retry failed deliveries
- Webhook health validation
- Performance analysis and optimization
- Configuration updates and testing

This webhook system provides enterprise-grade reliability, monitoring, and management capabilities for robust webhook delivery in production environments.