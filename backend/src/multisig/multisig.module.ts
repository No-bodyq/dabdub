import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultisigRequest } from './entities/multisig-request.entity';
import { MultisigService } from './multisig.service';
import { MultisigController } from './multisig.controller';
import { Admin } from '../admin/entities/admin.entity';
import { StellarModule } from '../stellar/stellar.module';
import { EmailModule } from '../email/email.module';
import { PushModule } from '../push/push.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MultisigRequest, Admin]),
    StellarModule,
    EmailModule,
    PushModule,
    QueueModule,
  ],
  providers: [MultisigService],
  controllers: [MultisigController],
  exports: [MultisigService],
})
export class MultisigModule {}
