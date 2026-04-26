import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { Webhook } from './entities/webhook.entity';
import { RetryModule } from '../retry/retry.module';

@Module({
  imports: [TypeOrmModule.forFeature([Webhook]), RetryModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
