import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookConfigurationEntity, WebhookStatus } from '../../database/entities/webhook-configuration.entity';
import { WebhookRetryService } from './webhook-retry.service';

@Injectable()
export class WebhookHealthMonitorService {
  private readonly logger = new Logger(WebhookHealthMonitorService.name);

  constructor(
    @InjectRepository(WebhookConfigurationEntity)
    private readonly webhookRepository: Repository<WebhookConfigurationEntity>,
    private readonly retryService: WebhookRetryService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorHealth(): Promise<void> {
    const activeWebhooks = await this.webhookRepository.find({
      where: { isActive: true },
    });
    const now = new Date();

    await Promise.all(
      activeWebhooks.map(async (webhook) => {
        // Check if webhook should be disabled due to failure count
        if (
          webhook.maxFailureCount &&
          webhook.failureCount >= webhook.maxFailureCount
        ) {
          webhook.isActive = false;
          webhook.disabledAt = now;
          webhook.disabledReason = 'Exceeded maximum failure count';
          await this.webhookRepository.save(webhook);
          this.logger.warn(`Paused unhealthy webhook ${webhook.id}`);
        }

        // Check if webhook should be disabled due to consecutive failures
        if (
          webhook.maxConsecutiveFailures &&
          webhook.consecutiveFailures >= webhook.maxConsecutiveFailures
        ) {
          webhook.status = WebhookStatus.FAILED;
          webhook.disabledAt = now;
          webhook.disabledReason = `Exceeded maximum consecutive failures (${webhook.consecutiveFailures})`;
          await this.webhookRepository.save(webhook);
          this.logger.warn(`Marked webhook ${webhook.id} as failed due to consecutive failures`);
        }
      }),
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processAutomaticRetries(): Promise<void> {
    try {
      const activeWebhooks = await this.webhookRepository.find({
        where: { isActive: true, status: WebhookStatus.ACTIVE },
        select: ['id'],
      });

      for (const webhook of activeWebhooks) {
        await this.retryService.scheduleAutomaticRetries(webhook.id);
      }
    } catch (error) {
      this.logger.error('Failed to process automatic retries', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async generateHealthReport(): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.find();
      const healthyCount = webhooks.filter(w => w.isActive && w.consecutiveFailures < 3).length;
      const unhealthyCount = webhooks.filter(w => !w.isActive || w.consecutiveFailures >= 5).length;
      const totalCount = webhooks.length;

      if (totalCount > 0) {
        const healthPercentage = (healthyCount / totalCount) * 100;
        
        if (healthPercentage < 80) {
          this.logger.warn(
            `Webhook system health is degraded: ${healthyCount}/${totalCount} (${healthPercentage.toFixed(1)}%) webhooks are healthy`
          );
        } else {
          this.logger.log(
            `Webhook system health is good: ${healthyCount}/${totalCount} (${healthPercentage.toFixed(1)}%) webhooks are healthy`
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to generate health report', error);
    }
  }

  async getWebhookHealth(webhookId: string): Promise<{
    isHealthy: boolean;
    status: string;
    consecutiveFailures: number;
    lastSuccess?: Date;
    lastFailure?: Date;
    recommendations: string[];
  }> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const recommendations: string[] = [];
    let status = 'healthy';
    let isHealthy = true;

    if (!webhook.isActive) {
      status = 'disabled';
      isHealthy = false;
      recommendations.push('Webhook is disabled. Enable it to resume deliveries.');
    } else if (webhook.consecutiveFailures >= 10) {
      status = 'critical';
      isHealthy = false;
      recommendations.push('High number of consecutive failures. Check endpoint availability.');
    } else if (webhook.consecutiveFailures >= 5) {
      status = 'unhealthy';
      isHealthy = false;
      recommendations.push('Multiple consecutive failures detected. Investigate endpoint issues.');
    } else if (webhook.consecutiveFailures >= 3) {
      status = 'degraded';
      recommendations.push('Some recent failures detected. Monitor endpoint closely.');
    }

    if (webhook.timeout < 5000) {
      recommendations.push('Consider increasing timeout value for better reliability.');
    }

    if (!webhook.secret) {
      recommendations.push('Add a webhook secret for enhanced security.');
    }

    return {
      isHealthy,
      status,
      consecutiveFailures: webhook.consecutiveFailures,
      lastSuccess: webhook.lastDeliveredAt,
      lastFailure: webhook.lastFailureAt,
      recommendations,
    };
  }
}
