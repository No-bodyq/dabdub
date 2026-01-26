import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookConfiguration } from '../database/entities/webhook-configuration.entity';
import { WebhookDeliveryLog } from '../database/entities/webhook-delivery-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookConfiguration, WebhookDeliveryLog]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
