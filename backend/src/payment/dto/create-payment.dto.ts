import {
  IsNumber,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsPositive,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Amount in minor units (e.g. cents)',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', example: 'USD' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ description: 'Payment description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Idempotency key to prevent duplicate payments' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({
    description: 'Optional reference or order id',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;
}
