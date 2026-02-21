import { Injectable, Logger } from '@nestjs/common';
import * as Twilio from 'twilio';
import { GlobalConfigService } from '../../config/global-config.service';
import { NotificationProvider } from '../interfaces/notification-provider.interface';

@Injectable()
export class SmsProvider implements NotificationProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private client!: Twilio.Twilio;

  constructor(private configService: GlobalConfigService) {
    const config = this.configService.getSmsConfig();
    if (config.twilioAccountSid && config.twilioAuthToken) {
      this.client = new Twilio.Twilio(
        config.twilioAccountSid,
        config.twilioAuthToken,
      );
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  async send(
    recipient: string,
    content: string,
    subject?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    const from = this.configService.getSmsConfig().twilioPhoneNumber;
    if (!from) {
      throw new Error('Twilio phone number not configured');
    }

    try {
      await this.client.messages.create({
        body: content,
        from,
        to: recipient,
        ...metadata,
      });
      this.logger.log(`SMS sent to ${recipient}`);
    } catch (error) {
      this.logger.error(`Error sending SMS to ${recipient}`, error);
      throw error;
    }
  }
}
