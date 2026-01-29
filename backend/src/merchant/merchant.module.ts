import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../database/entities/merchant.entity';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './services/merchant.service';
import { MerchantRepository } from './repositories/merchant.repository';
import { MockEmailService } from './services/mock-email.service';
import { MockBankVerificationService } from './services/mock-bank-verification.service';

/**
 * Module for merchant registration, profile management, and KYC workflows
 */
@Module({
    imports: [TypeOrmModule.forFeature([Merchant])],
    controllers: [MerchantController],
    providers: [
        MerchantRepository,
        MerchantService,
        {
            provide: 'IEmailService',
            useClass: MockEmailService,
        },
        {
            provide: 'IBankVerificationService',
            useClass: MockBankVerificationService,
        },
    ],
    exports: [MerchantService, MerchantRepository, TypeOrmModule],
})
export class MerchantModule {}
