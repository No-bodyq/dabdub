import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ReportService } from './report.service';
import { Settlement } from '../settlement/entities/settlement.entity';
import { Merchant } from '../database/entities/merchant.entity';
import { PaymentRequest } from '../database/entities/payment-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, Merchant, PaymentRequest]),
    CacheModule.register(),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ReportService],
  exports: [AnalyticsService, ReportService],
})
export class AnalyticsModule {}
