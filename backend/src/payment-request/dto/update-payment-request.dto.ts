import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdatePaymentRequestDto {
  @ApiPropertyOptional({ description: 'Payment amount', example: 10.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.0000001)
  @Max(1000000)
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

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
