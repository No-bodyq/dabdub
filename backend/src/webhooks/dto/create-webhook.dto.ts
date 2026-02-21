import {
  IsUrl,
  IsEnum,
  IsArray,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WebhookEvent } from '../../database/entities/webhook-configuration.entity';

export class CreateWebhookDto {
  @ApiProperty({
    description: 'The URL to send webhook requests to',
    example: 'https://api.merchant.com/webhooks',
  })
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  url!: string;

  @ApiProperty({
    description: 'The events to subscribe to',
    enum: WebhookEvent,
    isArray: true,
    example: [
      WebhookEvent.PAYMENT_REQUEST_CREATED,
      WebhookEvent.PAYMENT_REQUEST_COMPLETED,
    ],
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsNotEmpty()
  events!: WebhookEvent[];

  @ApiProperty({
    description: 'Whether the webhook is active',
    required: false,
    default: true,
  })
  @IsOptional()
  isActive?: boolean;
}
