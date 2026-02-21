import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsUrl,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycStatus, MerchantStatus } from '../../database/entities/merchant.entity';
import { ApiKey } from '../../api-key/entities/api-key.entity';

export enum MerchantTier {
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
}

export class SettlementConfigDto {
  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ example: '4321' })
  @IsString()
  bankAccountLast4: string;

  @ApiProperty({ example: 'DAILY' })
  @IsString()
  settlementFrequency: string;

  @ApiProperty({ example: 100 })
  minimumSettlementAmount: number;
}

export class UpdateSettlementConfigDto {
  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'DAILY' })
  @IsOptional()
  @IsString()
  settlementFrequency?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  minimumSettlementAmount?: number;
}

export class FeeStructureDto {
  @ApiProperty({ example: '1.50' })
  @IsString()
  transactionFeePercentage: string;

  @ApiProperty({ example: '0.30' })
  @IsString()
  transactionFeeFlat: string;

  @ApiProperty({ example: '0.25' })
  @IsString()
  settlementFeePercentage: string;

  @ApiProperty({ example: '0.50' })
  @IsString()
  minimumFee: string;

  @ApiProperty({ example: '50.00' })
  @IsString()
  maximumFee: string;
}

export class UpdateMerchantDto {
  @ApiPropertyOptional({ enum: MerchantTier })
  @IsOptional()
  @IsEnum(MerchantTier)
  tier?: MerchantTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  supportedChains?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSettlementConfigDto)
  settlementConfig?: UpdateSettlementConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNote?: string;
}

export class MerchantStatsDto {
  @ApiProperty()
  totalVolumeUsd: string;

  @ApiProperty()
  totalTransactionCount: number;

  @ApiProperty()
  last30DaysVolumeUsd: string;

  @ApiProperty()
  last30DaysTransactionCount: number;

  @ApiProperty()
  successRate: string;

  @ApiProperty()
  averageTransactionUsd: string;
}

export class MerchantDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  contact: { firstName: string; lastName: string; phone: string };

  @ApiProperty()
  countryCode: string;

  @ApiProperty()
  registrationNumber: string;

  @ApiProperty()
  businessType: string;

  @ApiProperty({ enum: MerchantTier })
  tier: MerchantTier;

  @ApiProperty({ enum: MerchantStatus })
  status: MerchantStatus;

  @ApiProperty()
  activatedAt: Date;

  @ApiProperty({ type: SettlementConfigDto })
  settlementConfig: SettlementConfigDto;

  @ApiProperty({ type: FeeStructureDto })
  feeStructure: FeeStructureDto;

  @ApiProperty()
  supportedChains: string[];

  @ApiProperty({ type: [ApiKey] }) // In reality, use a simpler DTO for API keys
  apiKeys: any[];

  @ApiProperty({ type: MerchantStatsDto })
  stats: MerchantStatsDto;

  @ApiProperty()
  kycStatus: {
    status: KycStatus;
    reviewedAt?: Date;
    reviewedBy?: { id: string; email: string };
  };

  @ApiProperty()
  flags: string[];

  @ApiProperty()
  notes: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}


export class RegisterMerchantDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'merchant@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'My Business LLC' })
  @IsOptional()
  @IsString()
  businessName?: string;
}

export class LoginMerchantDto {
  @ApiProperty({ example: 'merchant@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'My Business LLC' })
  @IsOptional()
  @IsString()
  businessName?: string;
}

export class BankDetailsDto {
  @ApiProperty({ example: 'Bank of America' })
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @ApiPropertyOptional({ example: 'BOFAUS3N' })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  routingNumber?: string;
}

export class SettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class KycDocumentsDto {
  @ApiProperty({ example: 'https://example.com/id.jpg' })
  @IsNotEmpty()
  @IsString() // For now assuming URL strings, might change if file upload is handled differently
  identityDocumentUrl: string;

  @ApiPropertyOptional({ example: 'https://example.com/business.pdf' })
  @IsOptional()
  @IsString()
  businessRegistrationUrl?: string;
}

export class MerchantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  businessName: string;

  @ApiProperty({ enum: KycStatus })
  kycStatus: KycStatus;

  @ApiProperty()
  createdAt: Date;
}

export class SearchMerchantsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kycStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}
