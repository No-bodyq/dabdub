import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WebhookDeliveryService } from './webhook-delivery.service';
import {
  WebhookDeliveryLogEntity,
  WebhookDeliveryStatus,
} from '../../database/entities/webhook-delivery-log.entity';
import { WebhookConfigurationEntity } from '../../database/entities/webhook-configuration.entity';
import { BulkRetryRequestDto } from '../dto/webhook-monitoring.dto';

export interface RetryResult {
  deliveryId: string;
  status: 'queued' | 'failed' | 'skipped';
  reason?: string;
}

@Injectable()
export class WebhookRetryService {
  private readonly logger = new Logger(WebhookRetryService.name);

  constructor(
    @InjectRepository(WebhookDeliveryLogEntity)
    private readonly deliveryLogRepository: Repository<WebhookDeliveryLogEntity>,
    @InjectRepository(WebhookConfigurationEntity)
    private readonly webhookRepository: Repository<WebhookConfigurationEntity>,
    private readonly webhookDeliveryService: WebhookDeliveryService,
  ) {}

  async retryDelivery(deliveryId: string): Promise<RetryResult> {
    const delivery = await this.deliveryLogRepository.findOne({
      where: { id: deliveryId },
      relations: ['webhookConfiguration'],
    });

    if (!delivery) {
      return {
        deliveryId,
        status: 'failed',
        reason: 'Delivery log not found',
      };
    }

    if (delivery.status !== WebhookDeliveryStatus.FAILED) {
      return {
        deliveryId,
        status: 'skipped',
        reason: 'Only failed deliveries can be retried',
      };
    }

    if (!delivery.webhookConfiguration.isActive) {
      return {
        deliveryId,
        status: 'skipped',
        reason: 'Webhook is not active',
      };
    }

    try {
      await this.webhookDeliveryService.enqueueDelivery(
        delivery.webhookConfigId,
        delivery.event,
        delivery.payload,
        {
          paymentRequestId: delivery.paymentRequestId,
          requestId: delivery.requestId,
          correlationId: delivery.correlationId,
          traceId: delivery.traceId,
          userAgent: delivery.userAgent,
          ipAddress: delivery.ipAddress,
        },
      );

      this.logger.log(`Queued retry for delivery ${deliveryId}`);
      
      return {
        deliveryId,
        status: 'queued',
      };
    } catch (error) {
      this.logger.error(`Failed to queue retry for delivery ${deliveryId}`, error);
      
      return {
        deliveryId,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async bulkRetryDeliveries(
    webhookId: string,
    request: BulkRetryRequestDto,
  ): Promise<{
    results: RetryResult[];
    summary: {
      total: number;
      queued: number;
      failed: number;
      skipped: number;
    };
  }> {
    const { deliveryIds, reason } = request;

    // Validate that all deliveries belong to the webhook
    const deliveries = await this.deliveryLogRepository.find({
      where: {
        id: In(deliveryIds),
        webhookConfigId: webhookId,
      },
      relations: ['webhookConfiguration'],
    });

    const foundIds = new Set(deliveries.map(d => d.id));
    const results: RetryResult[] = [];

    // Process each delivery ID
    for (const deliveryId of deliveryIds) {
      if (!foundIds.has(deliveryId)) {
        results.push({
          deliveryId,
          status: 'failed',
          reason: 'Delivery not found or does not belong to this webhook',
        });
        continue;
      }

      const result = await this.retryDelivery(deliveryId);
      results.push(result);
    }

    // Log bulk retry operation
    if (reason) {
      this.logger.log(
        `Bulk retry initiated for webhook ${webhookId}: ${reason}. ` +
        `Processing ${deliveryIds.length} deliveries.`,
      );
    }

    // Calculate summary
    const summary = {
      total: results.length,
      queued: results.filter(r => r.status === 'queued').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };

    return { results, summary };
  }

  async retryAllFailedDeliveries(
    webhookId: string,
    maxAge?: Date,
  ): Promise<{
    results: RetryResult[];
    summary: {
      total: number;
      queued: number;
      failed: number;
      skipped: number;
    };
  }> {
    const whereConditions: any = {
      webhookConfigId: webhookId,
      status: WebhookDeliveryStatus.FAILED,
    };

    if (maxAge) {
      whereConditions.createdAt = { $gte: maxAge };
    }

    const failedDeliveries = await this.deliveryLogRepository.find({
      where: whereConditions,
      relations: ['webhookConfiguration'],
      order: { createdAt: 'DESC' },
      take: 1000, // Limit to prevent overwhelming the system
    });

    const results: RetryResult[] = [];

    for (const delivery of failedDeliveries) {
      const result = await this.retryDelivery(delivery.id);
      results.push(result);
    }

    this.logger.log(
      `Bulk retry all failed deliveries for webhook ${webhookId}. ` +
      `Processed ${results.length} deliveries.`,
    );

    const summary = {
      total: results.length,
      queued: results.filter(r => r.status === 'queued').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };

    return { results, summary };
  }

  async getRetryableDeliveries(
    webhookId: string,
    limit: number = 100,
  ): Promise<WebhookDeliveryLogEntity[]> {
    return this.deliveryLogRepository.find({
      where: {
        webhookConfigId: webhookId,
        status: WebhookDeliveryStatus.FAILED,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async scheduleAutomaticRetries(webhookId: string): Promise<void> {
    // Find deliveries that are eligible for automatic retry
    const eligibleDeliveries = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.status = :failed', { failed: WebhookDeliveryStatus.FAILED })
      .andWhere('log.attemptNumber < log.maxAttempts')
      .andWhere('log.nextRetryAt IS NOT NULL')
      .andWhere('log.nextRetryAt <= :now', { now: new Date() })
      .getMany();

    for (const delivery of eligibleDeliveries) {
      await this.retryDelivery(delivery.id);
    }

    if (eligibleDeliveries.length > 0) {
      this.logger.log(
        `Scheduled ${eligibleDeliveries.length} automatic retries for webhook ${webhookId}`,
      );
    }
  }
}