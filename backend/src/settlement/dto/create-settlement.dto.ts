import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, IsEmail } from 'class-validator';
import { IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreateSettlementDto {
  @ApiProperty({
    description: 'Settlement identifier',
    example: 'SETTLE-2024-001',
    minLength: 5,
    maxLength: 50,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Settlement amount in the base currency',
    example: 1000.50,
    minimum: 0.01,
    type: 'number',
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Three-letter currency code',
    example: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'NGN'],
  })
  @IsEnum(['USD', 'EUR', 'GBP', 'NGN'])
  currency: string;

  @ApiPropertyOptional({
    description: 'Settlement status',
    example: SettlementStatus.PENDING,
    enum: Object.values(SettlementStatus),
  })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @ApiPropertyOptional({
    description: 'Recipient email address',
    example: 'recipient@example.com',
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({
    description: 'Settlement description or memo',
    example: 'Payment for services rendered',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSettlementDto {
  @ApiPropertyOptional({
    description: 'Updated settlement status',
    enum: Object.values(SettlementStatus),
  })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @ApiPropertyOptional({
    description: 'Updated settlement amount',
    example: 1200.00,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

export class SettlementResponseDto {
  @ApiProperty({
    description: 'Settlement unique identifier',
    example: 'SETTLE-2024-001',
  })
  id: string;

  @ApiProperty({
    description: 'Settlement amount',
    example: 1000.50,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Current status of settlement',
    example: SettlementStatus.COMPLETED,
    enum: Object.values(SettlementStatus),
  })
  status: SettlementStatus;

  @ApiProperty({
    description: 'Settlement creation timestamp',
    example: '2024-01-20T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Settlement last update timestamp',
    example: '2024-01-20T11:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Settlement completion timestamp',
    example: '2024-01-20T12:00:00Z',
  })
  completedAt?: Date;


export class BankDetailsDto {
    @IsString()
    @IsNotEmpty()
    accountNumber!: string;

    @IsString()
    @IsNotEmpty()
    routingNumber!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    bankName!: string;
}

export class CreateSettlementDto {
    @IsUUID()
    @IsNotEmpty()
    paymentRequestId!: string;

    @IsUUID()
    @IsNotEmpty()
    merchantId!: string;

    @IsNumber()
    @IsNotEmpty()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsNotEmpty()
    sourceCurrency!: string;

    @ValidateNested()
    @Type(() => BankDetailsDto)
    @IsNotEmpty()
    bankDetails!: BankDetailsDto;
}
