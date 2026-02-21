import { ApiProperty } from '@nestjs/swagger';
import { WebhookEvent } from '../../database/entities/webhook-configuration.entity';

export class WebhookResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'https://api.merchant.com/webhooks' })
  url!: string;

  @ApiProperty({
    description:
      'The secret used to sign webhook payloads. Only returned on creation or when requested specifically.',
    required: false,
    example: 'whsec_...',
  })
  secret?: string;

  @ApiProperty({ enum: WebhookEvent, isArray: true })
  events!: WebhookEvent[];

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-01-26T13:07:13Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-26T13:07:13Z' })
  updatedAt!: Date;
}
