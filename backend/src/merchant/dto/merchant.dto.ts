import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsNumber,
    IsArray,
    IsUrl,
    MinLength,
    MaxLength,
    Min,
    Max,
    ValidateNested,
    IsUUID,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    MerchantStatus,
    KycStatus,
    BusinessType,
    BankAccountStatus,
} from '../../database/entities/merchant.entity';

/**
 * DTO for merchant registration
 */
export class RegisterMerchantDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the merchant owner' })
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    name!: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 8 chars)' })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password!: string;

    @ApiPropertyOptional({ example: 'Acme Corp', description: 'Business name' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    businessName?: string;

    @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;

    @ApiPropertyOptional({ example: 'https://acme.com', description: 'Website URL' })
    @IsOptional()
    @IsUrl()
    website?: string;

    @ApiPropertyOptional({ enum: BusinessType, description: 'Type of business' })
    @IsOptional()
    @IsEnum(BusinessType)
    businessType?: BusinessType;
}

/**
 * DTO for updating merchant profile
 */
export class UpdateMerchantProfileDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional({ example: 'Acme Corp' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    businessName?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;

    @ApiPropertyOptional({ example: 'https://acme.com' })
    @IsOptional()
    @IsUrl()
    website?: string;

    @ApiPropertyOptional({ enum: BusinessType })
    @IsOptional()
    @IsEnum(BusinessType)
    businessType?: BusinessType;

    @ApiPropertyOptional({ example: 'We sell widgets' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    businessDescription?: string;

    @ApiPropertyOptional({ example: 'retail' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    businessCategory?: string;
}

/**
 * DTO for business details
 */
export class UpdateBusinessDetailsDto {
    @ApiProperty({ example: 'Acme Corporation' })
    @IsString()
    @MaxLength(255)
    businessName!: string;

    @ApiProperty({ enum: BusinessType })
    @IsEnum(BusinessType)
    businessType!: BusinessType;

    @ApiPropertyOptional({ example: 'REG123456' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    businessRegistrationNumber?: string;

    @ApiPropertyOptional({ example: 'TAX123456' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    taxId?: string;

    @ApiPropertyOptional({ example: 'We provide excellent services' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    businessDescription?: string;

    @ApiPropertyOptional({ example: 'Technology' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    businessCategory?: string;
}

/**
 * DTO for address
 */
export class AddressDto {
    @ApiProperty({ example: '123 Main St' })
    @IsString()
    @MaxLength(255)
    addressLine1!: string;

    @ApiPropertyOptional({ example: 'Suite 100' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    addressLine2?: string;

    @ApiProperty({ example: 'San Francisco' })
    @IsString()
    @MaxLength(100)
    city!: string;

    @ApiProperty({ example: 'CA' })
    @IsString()
    @MaxLength(100)
    state!: string;

    @ApiProperty({ example: '94102' })
    @IsString()
    @MaxLength(20)
    postalCode!: string;

    @ApiProperty({ example: 'US', description: 'ISO 3166-1 alpha-2 country code' })
    @IsString()
    @MinLength(2)
    @MaxLength(2)
    country!: string;
}

/**
 * DTO for bank account details
 */
export class BankAccountDto {
    @ApiProperty({ example: '1234567890' })
    @IsString()
    @MaxLength(50)
    accountNumber!: string;

    @ApiProperty({ example: '021000021' })
    @IsString()
    @MaxLength(50)
    routingNumber!: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @MaxLength(255)
    accountHolderName!: string;

    @ApiProperty({ example: 'Chase Bank' })
    @IsString()
    @MaxLength(255)
    bankName!: string;

    @ApiPropertyOptional({ example: 'CHASUS33' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    swiftCode?: string;

    @ApiPropertyOptional({ example: 'GB82WEST12345698765432' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    iban?: string;
}

/**
 * DTO for KYC document upload
 */
export class KycDocumentDto {
    @ApiProperty({ example: 'government_id', description: 'Document type' })
    @IsString()
    @MaxLength(50)
    type!: string;

    @ApiProperty({ example: 'passport.pdf', description: 'File name' })
    @IsString()
    @MaxLength(255)
    fileName!: string;

    @ApiProperty({ example: 'https://storage.example.com/docs/passport.pdf' })
    @IsUrl()
    fileUrl!: string;
}

/**
 * DTO for submitting KYC documents
 */
export class SubmitKycDto {
    @ApiProperty({ type: [KycDocumentDto], description: 'Array of KYC documents' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => KycDocumentDto)
    documents!: KycDocumentDto[];
}

/**
 * DTO for KYC verification (admin)
 */
export class VerifyKycDto {
    @ApiProperty({ enum: ['approved', 'rejected'], description: 'Verification decision' })
    @IsEnum(['approved', 'rejected'])
    decision!: 'approved' | 'rejected';

    @ApiPropertyOptional({ example: 'Document unclear', description: 'Rejection reason' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    rejectionReason?: string;
}

/**
 * DTO for settlement preferences
 */
export class SettlementPreferencesDto {
    @ApiPropertyOptional({ example: 'daily', enum: ['daily', 'weekly', 'monthly'] })
    @IsOptional()
    @IsEnum(['daily', 'weekly', 'monthly'])
    settlementFrequency?: string;

    @ApiPropertyOptional({ example: 100, description: 'Minimum amount for settlement' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minimumSettlementAmount?: number;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    autoSettlementEnabled?: boolean;
}

/**
 * DTO for notification preferences
 */
export class NotificationPreferencesDto {
    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    emailNotifications?: boolean;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    smsNotifications?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    pushNotifications?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    paymentReceived?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    settlementCompleted?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    kycStatusUpdate?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    securityAlerts?: boolean;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    marketingEmails?: boolean;
}

/**
 * DTO for multi-currency support
 */
export class CurrencySettingsDto {
    @ApiProperty({ example: ['USD', 'EUR', 'GBP'], description: 'Supported currencies' })
    @IsArray()
    @IsString({ each: true })
    @Matches(/^[A-Z]{3}$/, { each: true, message: 'Currency must be a 3-letter ISO code' })
    supportedCurrencies!: string[];

    @ApiProperty({ example: 'USD', description: 'Default currency' })
    @IsString()
    @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code' })
    defaultCurrency!: string;
}

/**
 * DTO for merchant search/filter
 */
export class SearchMerchantsDto {
    @ApiPropertyOptional({ example: 'acme' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: MerchantStatus })
    @IsOptional()
    @IsEnum(MerchantStatus)
    status?: MerchantStatus;

    @ApiPropertyOptional({ enum: KycStatus })
    @IsOptional()
    @IsEnum(KycStatus)
    kycStatus?: KycStatus;

    @ApiPropertyOptional({ enum: BusinessType })
    @IsOptional()
    @IsEnum(BusinessType)
    businessType?: BusinessType;

    @ApiPropertyOptional({ example: 'US' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ example: 20, default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number;

    @ApiPropertyOptional({ example: 'createdAt', enum: ['createdAt', 'name', 'businessName', 'status'] })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * DTO for API quota update (admin)
 */
export class UpdateApiQuotaDto {
    @ApiProperty({ example: 5000, description: 'New API quota limit' })
    @IsNumber()
    @Min(0)
    @Max(1000000)
    apiQuotaLimit!: number;
}

/**
 * DTO for merchant status change (admin)
 */
export class ChangeMerchantStatusDto {
    @ApiProperty({ enum: MerchantStatus })
    @IsEnum(MerchantStatus)
    status!: MerchantStatus;

    @ApiPropertyOptional({ example: 'Violation of terms', description: 'Reason for status change' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}

/**
 * DTO for email verification
 */
export class VerifyEmailDto {
    @ApiProperty({ example: 'abc123token', description: 'Email verification token' })
    @IsString()
    token!: string;
}

/**
 * DTO for resend verification email
 */
export class ResendVerificationDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email!: string;
}

/**
 * Response DTO for merchant
 */
export class MerchantResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiPropertyOptional()
    businessName?: string;

    @ApiProperty()
    email!: string;

    @ApiPropertyOptional()
    phone?: string;

    @ApiPropertyOptional()
    website?: string;

    @ApiPropertyOptional({ enum: BusinessType })
    businessType?: BusinessType;

    @ApiProperty({ enum: MerchantStatus })
    status!: MerchantStatus;

    @ApiProperty({ enum: KycStatus })
    kycStatus!: KycStatus;

    @ApiProperty()
    emailVerified!: boolean;

    @ApiProperty({ enum: BankAccountStatus })
    bankAccountStatus!: BankAccountStatus;

    @ApiProperty()
    supportedCurrencies!: string[];

    @ApiProperty()
    defaultCurrency!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * Response DTO for merchant analytics
 */
export class MerchantAnalyticsDto {
    @ApiProperty()
    totalPayments!: number;

    @ApiProperty()
    totalPaymentAmount!: number;

    @ApiProperty()
    totalSettlements!: number;

    @ApiProperty()
    totalSettledAmount!: number;

    @ApiProperty()
    pendingSettlements!: number;

    @ApiProperty()
    pendingSettlementAmount!: number;

    @ApiProperty()
    averagePaymentAmount!: number;

    @ApiProperty()
    apiQuotaUsed!: number;

    @ApiProperty()
    apiQuotaLimit!: number;

    @ApiProperty()
    apiQuotaPercentage!: number;
}

/**
 * Response DTO for paginated merchant list
 */
export class PaginatedMerchantsDto {
    @ApiProperty({ type: [MerchantResponseDto] })
    data!: MerchantResponseDto[];

    @ApiProperty()
    total!: number;

    @ApiProperty()
    page!: number;

    @ApiProperty()
    limit!: number;

    @ApiProperty()
    totalPages!: number;
}
