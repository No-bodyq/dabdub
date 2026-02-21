import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdatePaymentRequestDto {
  @ApiPropertyOptional({ description: 'Payment amount', example: 10.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.0000001)
  amount?: number;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Customer wallet address' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  customerWalletAddress?: string;

  @ApiPropertyOptional({ description: 'Customer identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Webhook URL override for this payment request',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
