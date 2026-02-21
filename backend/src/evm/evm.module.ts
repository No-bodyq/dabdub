import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EVMService } from './evm.service';
import { EVMBlockMonitorService } from './evm-block-monitor.service';
import { WalletEntity } from '../database/entities/wallet.entity';
import { EVMTransactionEntity } from '../database/entities/evm-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity, EVMTransactionEntity]),
    ConfigModule,
  ],
  providers: [EVMService, EVMBlockMonitorService],
  exports: [EVMService],
})
export class EVMModule {}
