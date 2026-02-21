import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequest } from '../database/entities/payment-request.entity';
import { PaymentRequestRepository } from './repositories/payment-request.repository';
import { PaymentRequestService } from './payment-request.service';
import { PaymentRequestController } from './payment-request.controller';
import { QrCodeService } from './services/qr-code.service';
import { ExpirationSchedulerService } from './services/expiration-scheduler.service';
import { StellarContractService } from './services/stellar-contract.service';
import { GlobalConfigModule } from '../config/config.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRequest]), GlobalConfigModule],
  controllers: [PaymentRequestController],
  providers: [
    PaymentRequestRepository,
    PaymentRequestService,
    QrCodeService,
    ExpirationSchedulerService,
    StellarContractService,
  ],
  exports: [PaymentRequestService, PaymentRequestRepository],
})
export class PaymentRequestModule {}
