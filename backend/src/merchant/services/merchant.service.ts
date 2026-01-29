import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { MerchantRepository } from '../repositories/merchant.repository';
import {
    Merchant,
    MerchantStatus,
    KycStatus,
    BankAccountStatus,
    KycDocument,
    NotificationPreferences,
} from '../../database/entities/merchant.entity';
import {
    RegisterMerchantDto,
    UpdateMerchantProfileDto,
    UpdateBusinessDetailsDto,
    AddressDto,
    BankAccountDto,
    SubmitKycDto,
    VerifyKycDto,
    SettlementPreferencesDto,
    NotificationPreferencesDto,
    CurrencySettingsDto,
    SearchMerchantsDto,
    UpdateApiQuotaDto,
    ChangeMerchantStatusDto,
    MerchantAnalyticsDto,
} from '../dto/merchant.dto';
import {
    MerchantNotFoundException,
    MerchantAlreadyExistsException,
    MerchantSuspendedException,
    MerchantClosedException,
    MerchantInactiveException,
    MerchantInvalidStatusException,
    MerchantEmailNotVerifiedException,
    MerchantEmailAlreadyVerifiedException,
    MerchantVerificationTokenInvalidException,
    MerchantVerificationTokenExpiredException,
    KycNotStartedException,
    KycAlreadySubmittedException,
    KycAlreadyApprovedException,
    KycDocumentRequiredException,
    KycInvalidStatusException,
    BankAccountNotFoundException,
    BankAccountVerificationFailedException,
    BankAccountAlreadyVerifiedException,
    BankAccountInvalidException,
    ApiQuotaExceededException,
} from '../exceptions/merchant.exceptions';
import { IEmailService, IBankVerificationService } from '../interfaces/email-service.interface';

/**
 * Valid status transitions for merchants
 */
const VALID_STATUS_TRANSITIONS: Record<MerchantStatus, MerchantStatus[]> = {
    [MerchantStatus.PENDING]: [MerchantStatus.ACTIVE, MerchantStatus.SUSPENDED, MerchantStatus.CLOSED],
    [MerchantStatus.ACTIVE]: [MerchantStatus.INACTIVE, MerchantStatus.SUSPENDED, MerchantStatus.CLOSED],
    [MerchantStatus.INACTIVE]: [MerchantStatus.ACTIVE, MerchantStatus.SUSPENDED, MerchantStatus.CLOSED],
    [MerchantStatus.SUSPENDED]: [MerchantStatus.ACTIVE, MerchantStatus.CLOSED],
    [MerchantStatus.CLOSED]: [],
};

/**
 * Valid KYC status transitions
 */
const VALID_KYC_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
    [KycStatus.NOT_STARTED]: [KycStatus.PENDING],
    [KycStatus.PENDING]: [KycStatus.IN_REVIEW, KycStatus.REJECTED],
    [KycStatus.IN_REVIEW]: [KycStatus.APPROVED, KycStatus.REJECTED],
    [KycStatus.APPROVED]: [KycStatus.EXPIRED],
    [KycStatus.REJECTED]: [KycStatus.PENDING],
    [KycStatus.EXPIRED]: [KycStatus.PENDING],
};

/**
 * Comprehensive merchant service for registration, profile management, and KYC workflows
 */
@Injectable()
export class MerchantService {
    private readonly logger = new Logger(MerchantService.name);
    private readonly SALT_ROUNDS = 10;
    private readonly VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

    constructor(
        private readonly merchantRepository: MerchantRepository,
        @Inject('IEmailService')
        private readonly emailService: IEmailService,
        @Inject('IBankVerificationService')
        private readonly bankVerificationService: IBankVerificationService,
    ) {}

    /**
     * Register a new merchant with validation
     * @param dto Registration data
     * @returns Created merchant
     */
    async registerMerchant(dto: RegisterMerchantDto): Promise<Merchant> {
        this.logger.log(`Registering new merchant: ${dto.email}`);

        // Check if merchant already exists
        const existingMerchant = await this.merchantRepository.findByEmail(dto.email);
        if (existingMerchant) {
            throw new MerchantAlreadyExistsException(dto.email);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

        // Generate email verification token
        const verificationToken = this.generateVerificationToken();
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + this.VERIFICATION_TOKEN_EXPIRY_HOURS);

        // Create merchant
        const merchant = await this.merchantRepository.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            passwordHash,
            businessName: dto.businessName,
            phone: dto.phone,
            website: dto.website,
            businessType: dto.businessType,
            status: MerchantStatus.PENDING,
            kycStatus: KycStatus.NOT_STARTED,
            emailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpiry,
            bankAccountStatus: BankAccountStatus.NOT_VERIFIED,
            supportedCurrencies: ['USD'],
            defaultCurrency: 'USD',
            settlementFrequency: 'daily',
            minimumSettlementAmount: 0,
            autoSettlementEnabled: true,
            apiQuotaLimit: 1000,
            apiQuotaUsed: 0,
            notificationPreferences: this.getDefaultNotificationPreferences(),
        });

        // Send verification email
        try {
            await this.emailService.sendVerificationEmail(dto.email, verificationToken, dto.name);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${dto.email}`, error);
        }

        this.logger.log(`Merchant registered successfully: ${merchant.id}`);
        return merchant;
    }

    /**
     * Verify merchant email address
     * @param token Verification token
     * @returns Updated merchant
     */
    async verifyEmail(token: string): Promise<Merchant> {
        this.logger.log('Verifying email with token');

        const merchant = await this.merchantRepository.findByVerificationToken(token);
        if (!merchant) {
            throw new MerchantVerificationTokenInvalidException();
        }

        if (merchant.emailVerified) {
            throw new MerchantEmailAlreadyVerifiedException();
        }

        if (merchant.emailVerificationExpiresAt && merchant.emailVerificationExpiresAt < new Date()) {
            throw new MerchantVerificationTokenExpiredException();
        }

        const updatedMerchant = await this.merchantRepository.update(merchant.id, {
            emailVerified: true,
            emailVerifiedAt: new Date(),
            emailVerificationToken: undefined,
            emailVerificationExpiresAt: undefined,
        });

        // Send welcome email
        try {
            await this.emailService.sendWelcomeEmail(merchant.email, merchant.name);
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${merchant.email}`, error);
        }

        this.logger.log(`Email verified for merchant: ${merchant.id}`);
        return updatedMerchant!;
    }

    /**
     * Resend email verification
     * @param email Merchant email
     */
    async resendVerificationEmail(email: string): Promise<void> {
        const merchant = await this.merchantRepository.findByEmail(email);
        if (!merchant) {
            throw new MerchantNotFoundException();
        }

        if (merchant.emailVerified) {
            throw new MerchantEmailAlreadyVerifiedException();
        }

        // Generate new token
        const verificationToken = this.generateVerificationToken();
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + this.VERIFICATION_TOKEN_EXPIRY_HOURS);

        await this.merchantRepository.update(merchant.id, {
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpiry,
        });

        await this.emailService.sendVerificationEmail(email, verificationToken, merchant.name);
        this.logger.log(`Verification email resent to: ${email}`);
    }

    /**
     * Get merchant by ID
     * @param id Merchant ID
     * @returns Merchant
     */
    async getMerchantById(id: string): Promise<Merchant> {
        const merchant = await this.merchantRepository.findById(id);
        if (!merchant) {
            throw new MerchantNotFoundException(id);
        }
        return merchant;
    }

    /**
     * Get merchant by email
     * @param email Merchant email
     * @returns Merchant
     */
    async getMerchantByEmail(email: string): Promise<Merchant> {
        const merchant = await this.merchantRepository.findByEmail(email);
        if (!merchant) {
            throw new MerchantNotFoundException();
        }
        return merchant;
    }

    /**
     * Update merchant profile
     * @param id Merchant ID
     * @param dto Profile update data
     * @returns Updated merchant
     */
    async updateProfile(id: string, dto: UpdateMerchantProfileDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);
        this.validateMerchantActive(merchant);

        const updatedMerchant = await this.merchantRepository.update(id, {
            name: dto.name,
            businessName: dto.businessName,
            phone: dto.phone,
            website: dto.website,
            businessType: dto.businessType,
            businessDescription: dto.businessDescription,
            businessCategory: dto.businessCategory,
        });

        this.logger.log(`Profile updated for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Update business details with validation
     * @param id Merchant ID
     * @param dto Business details
     * @returns Updated merchant
     */
    async updateBusinessDetails(id: string, dto: UpdateBusinessDetailsDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);
        this.validateMerchantActive(merchant);

        // Validate business registration number format if provided
        if (dto.businessRegistrationNumber) {
            this.validateBusinessRegistrationNumber(dto.businessRegistrationNumber);
        }

        // Validate tax ID format if provided
        if (dto.taxId) {
            this.validateTaxId(dto.taxId);
        }

        const updatedMerchant = await this.merchantRepository.update(id, {
            businessName: dto.businessName,
            businessType: dto.businessType,
            businessRegistrationNumber: dto.businessRegistrationNumber,
            taxId: dto.taxId,
            businessDescription: dto.businessDescription,
            businessCategory: dto.businessCategory,
        });

        this.logger.log(`Business details updated for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Update merchant address
     * @param id Merchant ID
     * @param dto Address data
     * @returns Updated merchant
     */
    async updateAddress(id: string, dto: AddressDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);
        this.validateMerchantActive(merchant);

        const updatedMerchant = await this.merchantRepository.update(id, {
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            city: dto.city,
            state: dto.state,
            postalCode: dto.postalCode,
            country: dto.country.toUpperCase(),
        });

        this.logger.log(`Address updated for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Submit KYC documents for verification
     * @param id Merchant ID
     * @param dto KYC documents
     * @returns Updated merchant
     */
    async submitKycDocuments(id: string, dto: SubmitKycDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);

        if (!merchant.emailVerified) {
            throw new MerchantEmailNotVerifiedException();
        }

        if (merchant.kycStatus === KycStatus.APPROVED) {
            throw new KycAlreadyApprovedException();
        }

        if (merchant.kycStatus === KycStatus.IN_REVIEW) {
            throw new KycAlreadySubmittedException();
        }

        // Validate required documents
        const requiredDocTypes = ['government_id', 'proof_of_address'];
        const submittedTypes = dto.documents.map(doc => doc.type);
        const missingDocs = requiredDocTypes.filter(type => !submittedTypes.includes(type));

        if (missingDocs.length > 0) {
            throw new KycDocumentRequiredException(missingDocs.join(', '));
        }

        // Create KYC documents array
        const kycDocuments: KycDocument[] = dto.documents.map(doc => ({
            type: doc.type,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            uploadedAt: new Date(),
            status: 'pending' as const,
        }));

        const updatedMerchant = await this.merchantRepository.updateKycStatus(id, KycStatus.PENDING, {
            kycDocuments,
            kycSubmittedAt: new Date(),
        });

        // Send confirmation email
        try {
            await this.emailService.sendKycSubmittedEmail(merchant.email, merchant.name);
        } catch (error) {
            this.logger.error(`Failed to send KYC submitted email to ${merchant.email}`, error);
        }

        this.logger.log(`KYC documents submitted for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Verify KYC documents (admin action)
     * @param id Merchant ID
     * @param dto Verification decision
     * @returns Updated merchant
     */
    async verifyKyc(id: string, dto: VerifyKycDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);

        if (merchant.kycStatus !== KycStatus.PENDING && merchant.kycStatus !== KycStatus.IN_REVIEW) {
            throw new KycInvalidStatusException(merchant.kycStatus, dto.decision);
        }

        let updatedMerchant: Merchant | null;

        if (dto.decision === 'approved') {
            updatedMerchant = await this.merchantRepository.updateKycStatus(id, KycStatus.APPROVED, {
                kycVerifiedAt: new Date(),
            });

            // Activate merchant if KYC approved and email verified
            if (merchant.emailVerified && merchant.status === MerchantStatus.PENDING) {
                await this.merchantRepository.updateStatus(id, MerchantStatus.ACTIVE);
                updatedMerchant = await this.getMerchantById(id);
            }

            try {
                await this.emailService.sendKycApprovedEmail(merchant.email, merchant.name);
            } catch (error) {
                this.logger.error(`Failed to send KYC approved email to ${merchant.email}`, error);
            }
        } else {
            updatedMerchant = await this.merchantRepository.updateKycStatus(id, KycStatus.REJECTED, {
                kycRejectionReason: dto.rejectionReason,
            });

            try {
                await this.emailService.sendKycRejectedEmail(
                    merchant.email,
                    merchant.name,
                    dto.rejectionReason || 'Documents could not be verified',
                );
            } catch (error) {
                this.logger.error(`Failed to send KYC rejected email to ${merchant.email}`, error);
            }
        }

        this.logger.log(`KYC ${dto.decision} for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Add or update bank account details
     * @param id Merchant ID
     * @param dto Bank account details
     * @returns Updated merchant
     */
    async updateBankAccount(id: string, dto: BankAccountDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);
        this.validateMerchantActive(merchant);

        // Validate bank account details
        this.validateBankAccountDetails(dto);

        const updatedMerchant = await this.merchantRepository.update(id, {
            bankAccountNumber: dto.accountNumber,
            bankRoutingNumber: dto.routingNumber,
            bankAccountHolderName: dto.accountHolderName,
            bankName: dto.bankName,
            bankSwiftCode: dto.swiftCode,
            bankIban: dto.iban,
            bankAccountStatus: BankAccountStatus.PENDING,
        });

        this.logger.log(`Bank account updated for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Verify bank account
     * @param id Merchant ID
     * @returns Updated merchant
     */
    async verifyBankAccount(id: string): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);

        if (!merchant.bankAccountNumber || !merchant.bankRoutingNumber) {
            throw new BankAccountNotFoundException();
        }

        if (merchant.bankAccountStatus === BankAccountStatus.VERIFIED) {
            throw new BankAccountAlreadyVerifiedException();
        }

        // Call bank verification service
        const result = await this.bankVerificationService.verifyBankAccount(
            merchant.bankAccountNumber,
            merchant.bankRoutingNumber,
            merchant.bankAccountHolderName || '',
        );

        if (!result.success) {
            await this.merchantRepository.updateBankAccountStatus(id, BankAccountStatus.FAILED);
            throw new BankAccountVerificationFailedException(result.error);
        }

        const updatedMerchant = await this.merchantRepository.updateBankAccountStatus(
            id,
            BankAccountStatus.VERIFIED,
        );

        // Send notification
        try {
            await this.emailService.sendBankAccountVerifiedEmail(merchant.email, merchant.name);
        } catch (error) {
            this.logger.error(`Failed to send bank verified email to ${merchant.email}`, error);
        }

        this.logger.log(`Bank account verified for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Update settlement preferences
     * @param id Merchant ID
     * @param dto Settlement preferences
     * @returns Updated merchant
     */
    async updateSettlementPreferences(id: string, dto: SettlementPreferencesDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);
        this.validateMerchantActive(merchant);

        const updatedMerchant = await this.merchantRepository.update(id, {
            settlementFrequency: dto.settlementFrequency,
            minimumSettlementAmount: dto.minimumSettlementAmount,
            autoSettlementEnabled: dto.autoSettlementEnabled,
        });

        this.logger.log(`Settlement preferences updated for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Update notification preferences
     * @param id Merchant ID
     * @param dto Notification preferences
     * @returns Updated merchant
     */
    async updateNotificationPreferences(id: string, dto: NotificationPreferencesDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);

        const currentPrefs = merchant.notificationPreferences || this.getDefaultNotificationPreferences();
        const newPrefs: NotificationPreferences = {
            ...currentPrefs,
            ...dto,
        };

        const updatedMerchant = await this.merchantRepository.update(id, {
            notificationPreferences: newPrefs,
        });

        this.logger.log(`Notification preferences updated for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Update currency settings
     * @param id Merchant ID
     * @param dto Currency settings
     * @returns Updated merchant
     */
    async updateCurrencySettings(id: string, dto: CurrencySettingsDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);
        this.validateMerchantActive(merchant);

        // Ensure default currency is in supported currencies
        if (!dto.supportedCurrencies.includes(dto.defaultCurrency)) {
            dto.supportedCurrencies.push(dto.defaultCurrency);
        }

        const updatedMerchant = await this.merchantRepository.update(id, {
            supportedCurrencies: dto.supportedCurrencies,
            defaultCurrency: dto.defaultCurrency,
        });

        this.logger.log(`Currency settings updated for merchant: ${id}`);
        return updatedMerchant!;
    }

    /**
     * Change merchant status (admin action)
     * @param id Merchant ID
     * @param dto Status change data
     * @returns Updated merchant
     */
    async changeMerchantStatus(id: string, dto: ChangeMerchantStatusDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);

        // Validate status transition
        const validTransitions = VALID_STATUS_TRANSITIONS[merchant.status];
        if (!validTransitions.includes(dto.status)) {
            throw new MerchantInvalidStatusException(merchant.status, dto.status);
        }

        const updateData: Partial<Merchant> = {};

        switch (dto.status) {
            case MerchantStatus.SUSPENDED:
                updateData.suspensionReason = dto.reason;
                break;
            case MerchantStatus.CLOSED:
                updateData.closedAt = new Date();
                updateData.closedReason = dto.reason;
                break;
        }

        const updatedMerchant = await this.merchantRepository.updateStatus(id, dto.status, updateData);

        // Send notification emails
        try {
            if (dto.status === MerchantStatus.SUSPENDED) {
                await this.emailService.sendAccountSuspendedEmail(merchant.email, merchant.name, dto.reason);
            } else if (dto.status === MerchantStatus.ACTIVE && merchant.status === MerchantStatus.SUSPENDED) {
                await this.emailService.sendAccountReactivatedEmail(merchant.email, merchant.name);
            }
        } catch (error) {
            this.logger.error(`Failed to send status change email to ${merchant.email}`, error);
        }

        this.logger.log(`Status changed for merchant ${id}: ${merchant.status} -> ${dto.status}`);
        return updatedMerchant!;
    }

    /**
     * Activate merchant
     * @param id Merchant ID
     * @returns Updated merchant
     */
    async activateMerchant(id: string): Promise<Merchant> {
        return this.changeMerchantStatus(id, { status: MerchantStatus.ACTIVE });
    }

    /**
     * Suspend merchant
     * @param id Merchant ID
     * @param reason Suspension reason
     * @returns Updated merchant
     */
    async suspendMerchant(id: string, reason?: string): Promise<Merchant> {
        return this.changeMerchantStatus(id, { status: MerchantStatus.SUSPENDED, reason });
    }

    /**
     * Close merchant account
     * @param id Merchant ID
     * @param reason Closure reason
     * @returns Updated merchant
     */
    async closeMerchantAccount(id: string, reason?: string): Promise<Merchant> {
        return this.changeMerchantStatus(id, { status: MerchantStatus.CLOSED, reason });
    }

    /**
     * Search and filter merchants
     * @param dto Search criteria
     * @returns Paginated merchant list
     */
    async searchMerchants(dto: SearchMerchantsDto): Promise<{
        data: Merchant[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { data, total } = await this.merchantRepository.search(dto);
        const page = dto.page || 1;
        const limit = dto.limit || 20;
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        };
    }

    /**
     * Get merchant analytics/statistics
     * @param id Merchant ID
     * @returns Analytics data
     */
    async getMerchantAnalytics(id: string): Promise<MerchantAnalyticsDto> {
        const merchant = await this.getMerchantById(id);

        // In a real implementation, this would aggregate data from payment and settlement tables
        // For now, return placeholder data structure
        return {
            totalPayments: 0,
            totalPaymentAmount: 0,
            totalSettlements: 0,
            totalSettledAmount: 0,
            pendingSettlements: 0,
            pendingSettlementAmount: 0,
            averagePaymentAmount: 0,
            apiQuotaUsed: merchant.apiQuotaUsed,
            apiQuotaLimit: merchant.apiQuotaLimit,
            apiQuotaPercentage: (merchant.apiQuotaUsed / merchant.apiQuotaLimit) * 100,
        };
    }

    /**
     * Update API quota limit (admin action)
     * @param id Merchant ID
     * @param dto Quota update data
     * @returns Updated merchant
     */
    async updateApiQuota(id: string, dto: UpdateApiQuotaDto): Promise<Merchant> {
        const merchant = await this.getMerchantById(id);

        const updatedMerchant = await this.merchantRepository.update(id, {
            apiQuotaLimit: dto.apiQuotaLimit,
        });

        this.logger.log(`API quota updated for merchant ${id}: ${dto.apiQuotaLimit}`);
        return updatedMerchant!;
    }

    /**
     * Check and increment API quota
     * @param id Merchant ID
     * @throws ApiQuotaExceededException if quota exceeded
     */
    async checkAndIncrementApiQuota(id: string): Promise<void> {
        const merchant = await this.getMerchantById(id);

        if (merchant.apiQuotaUsed >= merchant.apiQuotaLimit) {
            throw new ApiQuotaExceededException(merchant.apiQuotaLimit, merchant.apiQuotaResetAt || undefined);
        }

        await this.merchantRepository.incrementApiQuota(id);
    }

    /**
     * Cron job to reset API quotas daily
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetApiQuotas(): Promise<void> {
        this.logger.log('Resetting API quotas for all merchants...');
        await this.merchantRepository.resetApiQuotas();
        this.logger.log('API quotas reset completed');
    }

    /**
     * Cron job to clean up expired verification tokens
     */
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredTokens(): Promise<void> {
        this.logger.log('Cleaning up expired verification tokens...');
        const expiredMerchants = await this.merchantRepository.findExpiredVerificationTokens();

        for (const merchant of expiredMerchants) {
            await this.merchantRepository.update(merchant.id, {
                emailVerificationToken: undefined,
                emailVerificationExpiresAt: undefined,
            });
        }

        this.logger.log(`Cleaned up ${expiredMerchants.length} expired tokens`);
    }

    /**
     * Get merchant statistics (admin)
     */
    async getMerchantStatistics(): Promise<{
        total: number;
        active: number;
        pending: number;
        suspended: number;
        closed: number;
        kycPending: number;
        kycApproved: number;
        kycRejected: number;
    }> {
        return this.merchantRepository.getStatistics();
    }

    // Private helper methods

    private generateVerificationToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private getDefaultNotificationPreferences(): NotificationPreferences {
        return {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            paymentReceived: true,
            settlementCompleted: true,
            kycStatusUpdate: true,
            securityAlerts: true,
            marketingEmails: false,
        };
    }

    private validateMerchantActive(merchant: Merchant): void {
        if (merchant.status === MerchantStatus.SUSPENDED) {
            throw new MerchantSuspendedException(merchant.suspensionReason || undefined);
        }
        if (merchant.status === MerchantStatus.CLOSED) {
            throw new MerchantClosedException();
        }
    }

    private validateBusinessRegistrationNumber(regNumber: string): void {
        // Basic validation - can be enhanced based on country-specific formats
        if (regNumber.length < 5 || regNumber.length > 50) {
            throw new Error('Invalid business registration number format');
        }
    }

    private validateTaxId(taxId: string): void {
        // Basic validation - can be enhanced based on country-specific formats
        if (taxId.length < 5 || taxId.length > 50) {
            throw new Error('Invalid tax ID format');
        }
    }

    private validateBankAccountDetails(dto: BankAccountDto): void {
        // Validate account number (basic check)
        if (!/^\d{4,17}$/.test(dto.accountNumber)) {
            throw new BankAccountInvalidException('Invalid account number format');
        }

        // Validate routing number (US format - 9 digits)
        if (dto.routingNumber && !/^\d{9}$/.test(dto.routingNumber)) {
            throw new BankAccountInvalidException('Invalid routing number format');
        }

        // Validate SWIFT code if provided
        if (dto.swiftCode && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(dto.swiftCode)) {
            throw new BankAccountInvalidException('Invalid SWIFT code format');
        }

        // Validate IBAN if provided
        if (dto.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(dto.iban)) {
            throw new BankAccountInvalidException('Invalid IBAN format');
        }
    }
}
