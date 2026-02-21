import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { PublicController } from './public.controller';

@Module({
  imports: [PaymentModule],
  controllers: [PublicController],
})
export class PublicModule {}
