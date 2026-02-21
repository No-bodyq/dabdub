import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  IsEmail,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SettlementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class BankDetailsDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  routingNumber!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Chase Bank' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;
}

export class CreateSettlementDto {
  @ApiProperty({ description: 'Payment request identifier' })
  @IsUUID()
  @IsNotEmpty()
  paymentRequestId!: string;

  @ApiProperty({ description: 'Merchant identifier' })
  @IsUUID()
  @IsNotEmpty()
  merchantId!: string;

  @ApiProperty({ description: 'Settlement amount', example: 1000.5 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ description: 'Source currency code', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  sourceCurrency!: string;

  @ApiProperty({ type: BankDetailsDto })
  @ValidateNested()
  @Type(() => BankDetailsDto)
  @IsNotEmpty()
  bankDetails!: BankDetailsDto;

  @ApiPropertyOptional({
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @ApiPropertyOptional({ description: 'Recipient email address' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Description or memo' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSettlementDto {
  @ApiPropertyOptional({ enum: SettlementStatus })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @ApiPropertyOptional({ example: 1200.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

export class SettlementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  paymentRequestId!: string;

  @ApiProperty()
  merchantId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: SettlementStatus })
  status!: SettlementStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  settledAt?: Date;
}
