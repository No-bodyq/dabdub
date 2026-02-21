import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export class PaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Provider-specific status or code',
  })
  @IsOptional()
  @IsString()
  providerStatus?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Optional human-readable message',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
