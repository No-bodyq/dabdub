import { ApiProperty } from '@nestjs/swagger';
import { WebhookDeliveryStatus } from '../../database/entities/webhook-delivery-log.entity';

export class WebhookDeliveryLogResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'payment_request.completed' })
  event!: string;

  @ApiProperty({ enum: WebhookDeliveryStatus })
  status!: WebhookDeliveryStatus;

  @ApiProperty({ example: 1 })
  attemptNumber!: number;

  @ApiProperty({ example: 200, required: false })
  httpStatusCode?: number;

  @ApiProperty({ example: 154, required: false })
  responseTimeMs?: number;

  @ApiProperty({ example: '2026-01-26T13:07:13Z' })
  createdAt!: Date;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty({ required: false })
  payload?: any;

  @ApiProperty({ required: false })
  responseBody?: string;
}
