import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { Settlement } from './entities/settlement.entity';
import { Payment } from '../payments/entities/payment.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { RetryModule } from '../retry/retry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, Payment]),
    WebhooksModule,
    RetryModule,
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
