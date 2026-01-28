import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreatePaymentRequestDto {
  @ApiProperty({ description: 'Merchant identifier' })
  @IsUUID()
  @IsNotEmpty()
  merchantId!: string;

  @ApiProperty({ description: 'Payment amount (USDC, 7 decimal places)', example: 10.5 })
  @IsNumber()
  @Min(0.0000001)
  @Max(1000000)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ description: 'Currency code', example: 'USDC', default: 'USDC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency!: string;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Stellar network', example: 'testnet' })
  @IsOptional()
  @IsString()
  stellarNetwork?: string;

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

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Idempotency key for duplicate detection' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
