import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { WebhookDeliveryStatus } from '../../database/entities/webhook-delivery-log.entity';

export class WebhookDeliveryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by delivery status',
    enum: WebhookDeliveryStatus,
  })
  @IsOptional()
  @IsEnum(WebhookDeliveryStatus)
  status?: WebhookDeliveryStatus;

  @ApiPropertyOptional({
    description: 'Filter by event type',
    example: 'payment_request.completed',
  })
  @IsOptional()
  event?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class WebhookAnalyticsDto {
  @ApiProperty({
    description: 'Total number of deliveries',
    example: 1250,
  })
  totalDeliveries!: number;

  @ApiProperty({
    description: 'Number of successful deliveries',
    example: 1200,
  })
  successfulDeliveries!: number;

  @ApiProperty({
    description: 'Number of failed deliveries',
    example: 50,
  })
  failedDeliveries!: number;

  @ApiProperty({
    description: 'Success rate as percentage',
    example: 96.0,
  })
  successRate!: number;

  @ApiProperty({
    description: 'Average response time in milliseconds',
    example: 245,
  })
  averageResponseTime!: number;

  @ApiProperty({
    description: 'Median response time in milliseconds',
    example: 180,
  })
  medianResponseTime!: number;

  @ApiProperty({
    description: 'P95 response time in milliseconds',
    example: 450,
  })
  p95ResponseTime!: number;

  @ApiProperty({
    description: 'P99 response time in milliseconds',
    example: 800,
  })
  p99ResponseTime!: number;

  @ApiProperty({
    description: 'Deliveries by status',
    example: {
      delivered: 1200,
      failed: 50,
      pending: 0,
      sent: 0,
    },
  })
  deliveriesByStatus!: Record<string, number>;

  @ApiProperty({
    description: 'Deliveries by event type',
    example: {
      'payment_request.completed': 800,
      'payment_request.created': 400,
      'settlement.completed': 50,
    },
  })
  deliveriesByEvent!: Record<string, number>;

  @ApiProperty({
    description: 'Daily delivery counts for the period',
    example: [
      { date: '2026-01-01', count: 45 },
      { date: '2026-01-02', count: 52 },
    ],
  })
  dailyDeliveries!: Array<{ date: string; count: number }>;

  @ApiProperty({
    description: 'Error distribution by HTTP status code',
    example: {
      '404': 20,
      '500': 15,
      '503': 10,
      timeout: 5,
    },
  })
  errorDistribution!: Record<string, number>;
}

export class WebhookHealthStatusDto {
  @ApiProperty({
    description: 'Webhook configuration ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  webhookId!: string;

  @ApiProperty({
    description: 'Webhook URL',
    example: 'https://api.merchant.com/webhooks',
  })
  url!: string;

  @ApiProperty({
    description: 'Current health status',
    enum: ['healthy', 'degraded', 'unhealthy', 'disabled'],
    example: 'healthy',
  })
  status!: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';

  @ApiProperty({
    description: 'Success rate in the last 24 hours',
    example: 98.5,
  })
  successRate24h!: number;

  @ApiProperty({
    description: 'Average response time in the last 24 hours (ms)',
    example: 245,
  })
  avgResponseTime24h!: number;

  @ApiProperty({
    description: 'Number of consecutive failures',
    example: 0,
  })
  consecutiveFailures!: number;

  @ApiProperty({
    description: 'Last successful delivery timestamp',
    example: '2026-01-26T13:07:13Z',
    nullable: true,
  })
  lastSuccessAt?: Date;

  @ApiProperty({
    description: 'Last failure timestamp',
    example: '2026-01-25T10:30:00Z',
    nullable: true,
  })
  lastFailureAt?: Date;

  @ApiProperty({
    description: 'Health check details',
    example: {
      uptime: '99.9%',
      errorRate: '0.1%',
      avgLatency: '245ms',
    },
  })
  healthDetails!: Record<string, any>;
}

export class BulkRetryRequestDto {
  @ApiProperty({
    description: 'Array of delivery log IDs to retry',
    example: ['log-1', 'log-2', 'log-3'],
  })
  deliveryIds!: string[];

  @ApiPropertyOptional({
    description: 'Optional reason for the bulk retry',
    example: 'Endpoint was temporarily down',
  })
  reason?: string;
}

export class WebhookTestResultDto {
  @ApiProperty({
    description: 'Test delivery ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  deliveryId!: string;

  @ApiProperty({
    description: 'Test result status',
    example: 'success',
  })
  status!: 'success' | 'failed';

  @ApiProperty({
    description: 'HTTP status code received',
    example: 200,
  })
  httpStatusCode?: number;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 156,
  })
  responseTimeMs?: number;

  @ApiProperty({
    description: 'Error message if test failed',
    example: 'Connection timeout',
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Response body from the endpoint',
    example: '{"status": "ok"}',
  })
  responseBody?: string;

  @ApiProperty({
    description: 'Test timestamp',
    example: '2026-01-26T13:07:13Z',
  })
  testedAt!: Date;
}

export class WebhookRetryConfigDto {
  @ApiProperty({
    description: 'Maximum number of retry attempts',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  maxRetries!: number;

  @ApiProperty({
    description: 'Base delay between retries in milliseconds',
    example: 1000,
    minimum: 100,
    maximum: 60000,
  })
  @IsInt()
  @Min(100)
  @Max(60000)
  retryDelay!: number;

  @ApiProperty({
    description: 'Request timeout in milliseconds',
    example: 5000,
    minimum: 1000,
    maximum: 30000,
  })
  @IsInt()
  @Min(1000)
  @Max(30000)
  timeout!: number;
}