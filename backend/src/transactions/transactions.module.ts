import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatusHistory } from './entities/transaction-status-history.entity';
import { Settlement } from '../settlement/entities/settlement.entity';
import { WebhookDeliveryLogEntity } from '../database/entities/webhook-delivery-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      TransactionStatusHistory,
      Settlement,
      WebhookDeliveryLogEntity,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule { }
