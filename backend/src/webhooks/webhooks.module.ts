import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookConfigurationEntity } from '../database/entities/webhook-configuration.entity';
import { WebhookDeliveryLogEntity } from '../database/entities/webhook-delivery-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookConfigurationEntity,
      WebhookDeliveryLogEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
