import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUrl, IsArray, IsEnum, IsString, IsOptional } from 'class-validator';

export enum WebhookEvent {
  SETTLEMENT_CREATED = 'settlement.created',
  SETTLEMENT_COMPLETED = 'settlement.completed',
  SETTLEMENT_FAILED = 'settlement.failed',
  SETTLEMENT_UPDATED = 'settlement.updated',
}

export class CreateWebhookDto {
  @ApiProperty({
    description: 'Webhook endpoint URL',
    example: 'https://example.com/webhooks/settlement',
    format: 'uri',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'List of events to subscribe to',
    example: [WebhookEvent.SETTLEMENT_CREATED, WebhookEvent.SETTLEMENT_COMPLETED],
    isArray: true,
    enum: Object.values(WebhookEvent),
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({
    description: 'Custom webhook secret for HMAC signature verification',
    example: 'secret-key-123',
    minLength: 32,
  })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({
    description: 'Whether webhook is active',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}

export class WebhookResponseDto {
  @ApiProperty({
    description: 'Webhook configuration unique identifier',
    example: 'wh_123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Webhook endpoint URL',
    example: 'https://example.com/webhooks/settlement',
  })
  url: string;

  @ApiProperty({
    description: 'Subscribed events',
    isArray: true,
  })
  events: WebhookEvent[];

  @ApiProperty({
    description: 'Webhook active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Last successful delivery timestamp',
    example: '2024-01-20T10:30:00Z',
  })
  lastDeliveredAt: Date;

  @ApiProperty({
    description: 'Number of failed delivery attempts',
    example: 0,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Configuration creation timestamp',
    example: '2024-01-20T10:00:00Z',
  })
  createdAt: Date;
}
