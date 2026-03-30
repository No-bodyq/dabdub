import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../entities/merchant.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Settlement } from '../../settlement/entities/settlement.entity';
import { MerchantAnalyticsService } from './merchant-analytics.service';
import { MerchantAnalyticsController } from './merchant-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, Transaction, Settlement]),
  ],
  providers: [MerchantAnalyticsService],
  controllers: [MerchantAnalyticsController],
  exports: [MerchantAnalyticsService],
})
export class MerchantAnalyticsModule {}
