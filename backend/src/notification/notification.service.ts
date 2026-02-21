import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async sendNotification(
    userId: string,
    type: NotificationType,
    recipient: string,
    content: string,
    subject?: string,
    metadata?: Record<string, any>,
  ): Promise<Notification | null> {
    const isEnabled = await this.checkPreference(userId, type);
    if (!isEnabled) {
      this.logger.log(`Notification ${type} disabled for user ${userId}`);
      return null;
    }

    const notification = this.notificationRepository.create({
      userId,
      type,
      recipient,
      content,
      subject,
      metadata,
      status: NotificationStatus.PENDING,
    });

    await this.notificationRepository.save(notification);

    try {
      await this.notificationQueue.add('send-notification', {
        notificationId: notification.id,
      });
      notification.status = NotificationStatus.QUEUED;
    } catch (error: any) {
      this.logger.error(
        `Failed to queue notification ${notification.id}`,
        error,
      );
      notification.status = NotificationStatus.FAILED;
      notification.error = error.message;
    }

    return this.notificationRepository.save(notification);
  }

  private async checkPreference(
    userId: string,
    type: NotificationType,
  ): Promise<boolean> {
    if (!userId) return true; // System notifications might not have userId

    const preference = await this.preferenceRepository.findOne({
      where: { userId },
    });
    if (!preference) return true; // Default to enabled

    switch (type) {
      case NotificationType.EMAIL:
        return preference.emailEnabled;
      case NotificationType.SMS:
        return preference.smsEnabled;
      case NotificationType.PUSH:
        return preference.pushEnabled;
      default:
        return true;
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
