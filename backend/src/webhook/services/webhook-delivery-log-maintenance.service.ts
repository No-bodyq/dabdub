import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookDeliveryLogEntity } from '../../database/entities/webhook-delivery-log.entity';

@Injectable()
export class WebhookDeliveryLogMaintenanceService {
  private readonly logger = new Logger(
    WebhookDeliveryLogMaintenanceService.name,
  );

  constructor(
    @InjectRepository(WebhookDeliveryLogEntity)
    private readonly deliveryLogRepository: Repository<WebhookDeliveryLogEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredLogs(): Promise<void> {
    try {
      const result = (await this.deliveryLogRepository.query(`
        DELETE FROM webhook_delivery_logs
        WHERE (
          retention_until IS NOT NULL AND retention_until < NOW()
        )
        OR (
          retention_until IS NULL
          AND created_at < (NOW() - (retention_days || ' days')::interval)
        )
      `)) as { rowCount?: number } | unknown[];

      const deletedCount = Array.isArray(result)
        ? result.length
        : (result?.rowCount ?? 0);
      if (deletedCount > 0) {
        this.logger.log(
          `Deleted ${deletedCount} expired webhook delivery logs.`,
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        'Failed to cleanup expired webhook delivery logs.',
        err,
      );
    }
  }
}
