import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { PushProvider } from './providers/push.provider';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
    private pushProvider: PushProvider,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<{ notificationId: string }>) {
    const { notificationId } = job.data;
    this.logger.debug(`Processing notification ${notificationId}`);

    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      this.logger.error(`Notification ${notificationId} not found`);
      return;
    }

    try {
      await this.dispatchNotification(notification);
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
    } catch (error: any) {
      this.logger.error(`Failed to send notification ${notificationId}`, error);
      notification.status = NotificationStatus.FAILED;
      notification.error = error.message;
    } finally {
      await this.notificationRepository.save(notification);
    }
  }

  private async dispatchNotification(
    notification: Notification,
  ): Promise<void> {
    const { type, recipient, content, subject, metadata } = notification;

    switch (type) {
      case NotificationType.EMAIL:
        await this.emailProvider.send(recipient, content, subject, metadata);
        break;
      case NotificationType.SMS:
        await this.smsProvider.send(recipient, content, undefined, metadata);
        break;
      case NotificationType.PUSH:
        await this.pushProvider.send(recipient, content, subject, metadata);
        break;
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }
  }
}
