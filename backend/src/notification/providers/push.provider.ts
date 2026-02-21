import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { GlobalConfigService } from '../../config/global-config.service';
import { NotificationProvider } from '../interfaces/notification-provider.interface';

@Injectable()
export class PushProvider implements NotificationProvider {
  private readonly logger = new Logger(PushProvider.name);
  private initialized = false;

  constructor(private configService: GlobalConfigService) {
    const config = this.configService.getPushConfig();
    if (
      config.firebaseProjectId &&
      config.firebaseClientEmail &&
      config.firebasePrivateKey
    ) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebaseProjectId,
            clientEmail: config.firebaseClientEmail,
            privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.initialized = true;
      } catch (error) {
        this.logger.error('Error initializing Firebase', error);
      }
    } else {
      this.logger.warn('Firebase credentials not configured');
    }
  }

  async send(
    recipient: string, // FCM Token
    content: string,
    subject?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      await admin.messaging().send({
        token: recipient,
        notification: {
          title: subject,
          body: content,
        },
        data: metadata as any,
      });
      this.logger.log(`Push notification sent to ${recipient}`);
    } catch (error) {
      this.logger.error(
        `Error sending push notification to ${recipient}`,
        error,
      );
      throw error;
    }
  }
}
