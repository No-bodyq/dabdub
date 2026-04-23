import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmlFlag } from './entities/aml-flag.entity';
import { AmlService } from './aml.service';
import { AmlController } from './aml.controller';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AmlFlag, Payment])],
  providers: [AmlService],
  controllers: [AmlController],
  exports: [AmlService],
})
export class AmlModule {}
