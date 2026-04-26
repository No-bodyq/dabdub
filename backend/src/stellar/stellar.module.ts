import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StellarService } from './stellar.service';
import { StellarMonitorService } from './stellar-monitor.service';
import { Payment } from '../payments/entities/payment.entity';
import { SettlementsModule } from '../settlements/settlements.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { RetryModule } from '../retry/retry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    forwardRef(() => SettlementsModule),
    WebhooksModule,
    RetryModule,
  ],
  providers: [StellarService, StellarMonitorService],
  exports: [StellarService],
})
export class StellarModule {}
