import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { PushProvider } from './providers/push.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreference]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [
    NotificationService,
    NotificationProcessor,
    EmailProvider,
    SmsProvider,
    PushProvider,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
