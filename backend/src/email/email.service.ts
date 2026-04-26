import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryConfigService } from '../retry/retry-config.service';
import { RetryQueueService } from '../retry/retry-queue.service';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private config: ConfigService,
    private retryConfig: RetryConfigService,
    private retryQueue: RetryQueueService,
  ) {}

  async send(payload: EmailPayload): Promise<void> {
    await this.retryQueue.run('email', this.retryConfig.email, async () => {
      // Replace with real email provider (e.g. nodemailer, SendGrid, Resend)
      this.logger.log(`Sending email to ${payload.to}: ${payload.subject}`);
      throw new Error('Email provider not configured');
    });
  }
}
