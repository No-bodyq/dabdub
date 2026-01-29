import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Settlement } from '../../settlement/entities/settlement.entity';
import { PaymentRequest } from './payment-request.entity';

/**
 * Merchant account status
 */
export enum MerchantStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    CLOSED = 'closed',
}

/**
 * KYC verification status
 */
export enum KycStatus {
    NOT_STARTED = 'not_started',
    PENDING = 'pending',
    IN_REVIEW = 'in_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

/**
 * Business type classification
 */
export enum BusinessType {
    INDIVIDUAL = 'individual',
    SOLE_PROPRIETORSHIP = 'sole_proprietorship',
    PARTNERSHIP = 'partnership',
    LLC = 'llc',
    CORPORATION = 'corporation',
    NON_PROFIT = 'non_profit',
}

/**
 * Bank account verification status
 */
export enum BankAccountStatus {
    NOT_VERIFIED = 'not_verified',
    PENDING = 'pending',
    VERIFIED = 'verified',
    FAILED = 'failed',
}

@Entity('merchants')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['kycStatus'])
@Index(['createdAt'])
export class Merchant {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Basic Information
    @Column({ name: 'name', type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'business_name', type: 'varchar', length: 255, nullable: true })
    businessName?: string;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
    passwordHash?: string;

    @Column({ name: 'phone', type: 'varchar', length: 50, nullable: true })
    phone?: string;

    @Column({ name: 'website', type: 'varchar', length: 500, nullable: true })
    website?: string;

    // Business Details
    @Column({
        name: 'business_type',
        type: 'enum',
        enum: BusinessType,
        nullable: true,
    })
    businessType?: BusinessType;

    @Column({ name: 'business_registration_number', type: 'varchar', length: 100, nullable: true })
    businessRegistrationNumber?: string;

    @Column({ name: 'tax_id', type: 'varchar', length: 100, nullable: true })
    taxId?: string;

    @Column({ name: 'business_description', type: 'text', nullable: true })
    businessDescription?: string;

    @Column({ name: 'business_category', type: 'varchar', length: 100, nullable: true })
    businessCategory?: string;

    // Address
    @Column({ name: 'address_line1', type: 'varchar', length: 255, nullable: true })
    addressLine1?: string;

    @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
    addressLine2?: string;

    @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
    city?: string;

    @Column({ name: 'state', type: 'varchar', length: 100, nullable: true })
    state?: string;

    @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
    postalCode?: string;

    @Column({ name: 'country', type: 'varchar', length: 2, nullable: true })
    country?: string;

    // Status
    @Column({
        type: 'enum',
        enum: MerchantStatus,
        default: MerchantStatus.PENDING,
    })
    status!: MerchantStatus;

    // KYC Information
    @Column({
        name: 'kyc_status',
        type: 'enum',
        enum: KycStatus,
        default: KycStatus.NOT_STARTED,
    })
    kycStatus!: KycStatus;

    @Column({ name: 'kyc_submitted_at', type: 'timestamp', nullable: true })
    kycSubmittedAt?: Date;

    @Column({ name: 'kyc_verified_at', type: 'timestamp', nullable: true })
    kycVerifiedAt?: Date;

    @Column({ name: 'kyc_rejection_reason', type: 'text', nullable: true })
    kycRejectionReason?: string;

    @Column({ name: 'kyc_documents', type: 'jsonb', nullable: true })
    kycDocuments?: KycDocument[];

    // Email Verification
    @Column({ name: 'email_verified', type: 'boolean', default: false })
    emailVerified!: boolean;

    @Column({ name: 'email_verification_token', type: 'varchar', length: 255, nullable: true })
    emailVerificationToken?: string;

    @Column({ name: 'email_verification_expires_at', type: 'timestamp', nullable: true })
    emailVerificationExpiresAt?: Date;

    @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
    emailVerifiedAt?: Date;

    // Bank Account Details
    @Column({ name: 'bank_account_number', type: 'varchar', length: 50, nullable: true })
    bankAccountNumber?: string;

    @Column({ name: 'bank_routing_number', type: 'varchar', length: 50, nullable: true })
    bankRoutingNumber?: string;

    @Column({ name: 'bank_account_holder_name', type: 'varchar', length: 255, nullable: true })
    bankAccountHolderName?: string;

    @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: true })
    bankName?: string;

    @Column({ name: 'bank_swift_code', type: 'varchar', length: 20, nullable: true })
    bankSwiftCode?: string;

    @Column({ name: 'bank_iban', type: 'varchar', length: 50, nullable: true })
    bankIban?: string;

    @Column({
        name: 'bank_account_status',
        type: 'enum',
        enum: BankAccountStatus,
        default: BankAccountStatus.NOT_VERIFIED,
    })
    bankAccountStatus!: BankAccountStatus;

    @Column({ name: 'bank_verified_at', type: 'timestamp', nullable: true })
    bankVerifiedAt?: Date;

    // Multi-Currency Support
    @Column({ name: 'supported_currencies', type: 'jsonb', default: '["USD"]' })
    supportedCurrencies!: string[];

    @Column({ name: 'default_currency', type: 'varchar', length: 3, default: 'USD' })
    defaultCurrency!: string;

    // Settlement Preferences
    @Column({ name: 'settlement_frequency', type: 'varchar', length: 20, default: 'daily' })
    settlementFrequency!: string;

    @Column({ name: 'minimum_settlement_amount', type: 'decimal', precision: 19, scale: 4, default: 0 })
    minimumSettlementAmount!: number;

    @Column({ name: 'auto_settlement_enabled', type: 'boolean', default: true })
    autoSettlementEnabled!: boolean;

    // Notification Preferences
    @Column({ name: 'notification_preferences', type: 'jsonb', nullable: true })
    notificationPreferences?: NotificationPreferences;

    // API Quota Management
    @Column({ name: 'api_quota_limit', type: 'int', default: 1000 })
    apiQuotaLimit!: number;

    @Column({ name: 'api_quota_used', type: 'int', default: 0 })
    apiQuotaUsed!: number;

    @Column({ name: 'api_quota_reset_at', type: 'timestamp', nullable: true })
    apiQuotaResetAt?: Date;

    // Metadata
    @Column({ name: 'metadata', type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown>;

    @Column({ name: 'suspension_reason', type: 'text', nullable: true })
    suspensionReason?: string;

    @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
    closedAt?: Date;

    @Column({ name: 'closed_reason', type: 'text', nullable: true })
    closedReason?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relationships
    @OneToMany(() => Settlement, (settlement) => settlement.merchant)
    settlements!: Settlement[];

    @OneToMany(() => PaymentRequest, (paymentRequest) => paymentRequest.merchant)
    paymentRequests!: PaymentRequest[];
}

/**
 * KYC Document interface
 */
export interface KycDocument {
    type: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
}

/**
 * Notification preferences interface
 */
export interface NotificationPreferences {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    paymentReceived: boolean;
    settlementCompleted: boolean;
    kycStatusUpdate: boolean;
    securityAlerts: boolean;
    marketingEmails: boolean;
}
