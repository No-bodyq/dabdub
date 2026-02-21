import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { GlobalConfigService } from '../../config/global-config.service';
import { NotificationProvider } from '../interfaces/notification-provider.interface';

@Injectable()
export class EmailProvider implements NotificationProvider {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(private configService: GlobalConfigService) {
    const config = this.configService.getEmailConfig();
    if (config.sendgridApiKey) {
      sgMail.setApiKey(config.sendgridApiKey);
    } else {
      this.logger.warn('SendGrid API key not configured');
    }
  }

  async send(
    recipient: string,
    content: string,
    subject: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const from = this.configService.getEmailConfig().fromEmail;
    if (!from) {
      throw new Error('From email not configured');
    }

    const msg = {
      to: recipient,
      from,
      subject,
      text: content, // simple text fallback
      html: content, // using content as html
      ...metadata,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${recipient}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${recipient}`, error);
      throw error;
    }
  }
}
