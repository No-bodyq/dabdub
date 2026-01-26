import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementEntity } from '../database/entities/settlement.entity';
import { SettlementRepository } from './repositories/settlement.repository';
import { SettlementService } from './services/settlement.service';
import { SettlementController } from './controllers/settlement.controller';

import { SettlementService } from './settlement.service';
import { MockPartnerService } from './services/mock-partner.service';

import { SettlementController } from './settlement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement])],
  controllers: [SettlementController],
  providers: [
    SettlementRepository,
    SettlementService,
    {
      provide: 'IPartnerService',
      useClass: MockPartnerService,
    },
  ],
  exports: [SettlementRepository, SettlementService, TypeOrmModule, 'IPartnerService'],
})
export class SettlementModule { }
