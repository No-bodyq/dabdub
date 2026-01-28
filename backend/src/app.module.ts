import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
// Controllers & Services
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Config & Core Modules
import { GlobalConfigModule } from './global-config/global-config.module';
import { GlobalConfigService } from './global-config/global-config.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { LoggerModule } from './logger/logger.module';
// Feature Modules
import { NotificationModule } from './notification/notification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SettlementModule } from './settlement/settlement.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SwaggerDocModule } from './swagger-doc/swagger-doc.module';
import { NotificationModule } from './notification/notification.module';
import { GlobalConfigService } from './config/global-config.service';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { PaymentRequestModule } from './payment-request/payment-request.module';
// Middleware
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';


@Module({
  imports: [
    GlobalConfigModule,
    DatabaseModule,
    CacheModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    BullModule.forRootAsync({
      imports: [GlobalConfigModule],
      useFactory: async (configService: GlobalConfigService) => ({
        redis: {
          host: configService.getRedisConfig().host,
          port: configService.getRedisConfig().port,
        },
      }),
      inject: [GlobalConfigService],
    }),
    NotificationModule,
    AnalyticsModule,
    SettlementModule,
    TransactionsModule, // Added from feat/transaction-controller-33
    BlockchainModule,
    AuthModule,
    HealthModule,
    WebhooksModule,
    SwaggerDocModule,
    PublicModule,
    PaymentRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}