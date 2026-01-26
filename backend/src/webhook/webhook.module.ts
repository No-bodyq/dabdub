import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './controllers/webhook.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookConfigurationEntity } from '../database/entities/webhook-configuration.entity';
import { WebhookDeliveryLogEntity } from '../database/entities/webhook-delivery-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookConfigurationEntity, WebhookDeliveryLogEntity])],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
