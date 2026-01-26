import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { CacheModule } from './cache/cache.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { GlobalConfigModule } from './config/config.module';

import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [GlobalConfigModule, DatabaseModule, LoggerModule, WebhooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
