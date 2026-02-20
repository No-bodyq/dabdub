import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { WebhookConfigurationEntity } from '../../database/entities/webhook-configuration.entity';
import {
  WebhookDeliveryLogEntity,
  WebhookDeliveryStatus,
} from '../../database/entities/webhook-delivery-log.entity';
import {
  WebhookDeliveryQueryDto,
  WebhookAnalyticsDto,
  WebhookHealthStatusDto,
} from '../dto/webhook-monitoring.dto';

@Injectable()
export class WebhookMonitoringService {
  private readonly logger = new Logger(WebhookMonitoringService.name);

  constructor(
    @InjectRepository(WebhookConfigurationEntity)
    private readonly webhookRepository: Repository<WebhookConfigurationEntity>,
    @InjectRepository(WebhookDeliveryLogEntity)
    private readonly deliveryLogRepository: Repository<WebhookDeliveryLogEntity>,
  ) {}

  async getDeliveryLogs(
    webhookId: string,
    query: WebhookDeliveryQueryDto,
  ): Promise<{
    data: WebhookDeliveryLogEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, event, startDate, endDate, page = 1, limit = 50 } = query;
    
    const whereConditions: any = { webhookConfigId: webhookId };
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (event) {
      whereConditions.event = event;
    }
    
    if (startDate || endDate) {
      whereConditions.createdAt = Between(
        startDate ? new Date(startDate) : new Date('1970-01-01'),
        endDate ? new Date(endDate) : new Date(),
      );
    }

    const [data, total] = await this.deliveryLogRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWebhookAnalytics(
    webhookId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WebhookAnalyticsDto> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    // Get basic delivery statistics
    const deliveryStats = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select([
        'COUNT(*) as total_deliveries',
        'COUNT(CASE WHEN status = :delivered THEN 1 END) as successful_deliveries',
        'COUNT(CASE WHEN status = :failed THEN 1 END) as failed_deliveries',
        'AVG(CASE WHEN response_time_ms IS NOT NULL THEN response_time_ms END) as avg_response_time',
      ])
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt BETWEEN :start AND :end', { start, end })
      .setParameters({
        delivered: WebhookDeliveryStatus.DELIVERED,
        failed: WebhookDeliveryStatus.FAILED,
      })
      .getRawOne();

    // Get response time percentiles
    const responseTimePercentiles = await this.getResponseTimePercentiles(
      webhookId,
      start,
      end,
    );

    // Get deliveries by status
    const deliveriesByStatus = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select(['log.status', 'COUNT(*) as count'])
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('log.status')
      .getRawMany();

    // Get deliveries by event type
    const deliveriesByEvent = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select(['log.event', 'COUNT(*) as count'])
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('log.event')
      .getRawMany();

    // Get daily delivery counts
    const dailyDeliveries = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select([
        'DATE(log.createdAt) as date',
        'COUNT(*) as count',
      ])
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('DATE(log.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get error distribution
    const errorDistribution = await this.getErrorDistribution(
      webhookId,
      start,
      end,
    );

    const totalDeliveries = parseInt(deliveryStats.total_deliveries) || 0;
    const successfulDeliveries = parseInt(deliveryStats.successful_deliveries) || 0;
    const failedDeliveries = parseInt(deliveryStats.failed_deliveries) || 0;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(parseFloat(deliveryStats.avg_response_time) || 0),
      medianResponseTime: responseTimePercentiles.median,
      p95ResponseTime: responseTimePercentiles.p95,
      p99ResponseTime: responseTimePercentiles.p99,
      deliveriesByStatus: deliveriesByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
      deliveriesByEvent: deliveriesByEvent.reduce((acc, item) => {
        acc[item.event] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
      dailyDeliveries: dailyDeliveries.map(item => ({
        date: item.date,
        count: parseInt(item.count),
      })),
      errorDistribution,
    };
  }

  async getWebhookHealthStatus(webhookId: string): Promise<WebhookHealthStatusDto> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get 24h statistics
    const stats24h = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN status = :delivered THEN 1 END) as successful',
        'AVG(CASE WHEN response_time_ms IS NOT NULL THEN response_time_ms END) as avg_response_time',
      ])
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt >= :last24Hours', { last24Hours })
      .setParameter('delivered', WebhookDeliveryStatus.DELIVERED)
      .getRawOne();

    const total24h = parseInt(stats24h.total) || 0;
    const successful24h = parseInt(stats24h.successful) || 0;
    const successRate24h = total24h > 0 ? (successful24h / total24h) * 100 : 100;
    const avgResponseTime24h = Math.round(parseFloat(stats24h.avg_response_time) || 0);

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
    
    if (!webhook.isActive) {
      status = 'disabled';
    } else if (successRate24h >= 95 && webhook.consecutiveFailures < 3) {
      status = 'healthy';
    } else if (successRate24h >= 85 && webhook.consecutiveFailures < 5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      webhookId,
      url: webhook.url,
      status,
      successRate24h: Math.round(successRate24h * 100) / 100,
      avgResponseTime24h,
      consecutiveFailures: webhook.consecutiveFailures,
      lastSuccessAt: webhook.lastDeliveredAt,
      lastFailureAt: webhook.lastFailureAt,
      healthDetails: {
        uptime: `${Math.round(successRate24h * 10) / 10}%`,
        errorRate: `${Math.round((100 - successRate24h) * 10) / 10}%`,
        avgLatency: `${avgResponseTime24h}ms`,
        totalDeliveries24h: total24h,
        isActive: webhook.isActive,
        maxConsecutiveFailures: webhook.maxConsecutiveFailures,
      },
    };
  }

  async getAllWebhooksHealthStatus(): Promise<WebhookHealthStatusDto[]> {
    const webhooks = await this.webhookRepository.find({
      select: ['id'],
    });

    const healthStatuses = await Promise.all(
      webhooks.map(webhook => this.getWebhookHealthStatus(webhook.id)),
    );

    return healthStatuses;
  }

  async getFailedDeliveries(
    webhookId?: string,
    limit: number = 100,
  ): Promise<WebhookDeliveryLogEntity[]> {
    const whereConditions: any = {
      status: WebhookDeliveryStatus.FAILED,
    };

    if (webhookId) {
      whereConditions.webhookConfigId = webhookId;
    }

    return this.deliveryLogRepository.find({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['webhookConfiguration'],
    });
  }

  async getDeliveryTrends(
    webhookId: string,
    days: number = 7,
  ): Promise<Array<{
    date: string;
    successful: number;
    failed: number;
    avgResponseTime: number;
  }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select([
        'DATE(log.createdAt) as date',
        'COUNT(CASE WHEN status = :delivered THEN 1 END) as successful',
        'COUNT(CASE WHEN status = :failed THEN 1 END) as failed',
        'AVG(CASE WHEN response_time_ms IS NOT NULL THEN response_time_ms END) as avg_response_time',
      ])
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .setParameters({
        delivered: WebhookDeliveryStatus.DELIVERED,
        failed: WebhookDeliveryStatus.FAILED,
      })
      .groupBy('DATE(log.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return trends.map(trend => ({
      date: trend.date,
      successful: parseInt(trend.successful) || 0,
      failed: parseInt(trend.failed) || 0,
      avgResponseTime: Math.round(parseFloat(trend.avg_response_time) || 0),
    }));
  }

  private async getResponseTimePercentiles(
    webhookId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ median: number; p95: number; p99: number }> {
    const responseTimes = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select('log.responseTimeMs')
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('log.responseTimeMs IS NOT NULL')
      .orderBy('log.responseTimeMs', 'ASC')
      .getRawMany();

    if (responseTimes.length === 0) {
      return { median: 0, p95: 0, p99: 0 };
    }

    const times = responseTimes.map(rt => rt.responseTimeMs).sort((a, b) => a - b);
    const len = times.length;

    return {
      median: len > 0 ? times[Math.floor(len * 0.5)] : 0,
      p95: len > 0 ? times[Math.floor(len * 0.95)] : 0,
      p99: len > 0 ? times[Math.floor(len * 0.99)] : 0,
    };
  }

  private async getErrorDistribution(
    webhookId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const errors = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select([
        'COALESCE(CAST(log.httpStatusCode AS TEXT), \'timeout\') as error_type',
        'COUNT(*) as count',
      ])
      .where('log.webhookConfigId = :webhookId', { webhookId })
      .andWhere('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('log.status = :failed', { failed: WebhookDeliveryStatus.FAILED })
      .groupBy('error_type')
      .getRawMany();

    return errors.reduce((acc, error) => {
      acc[error.error_type] = parseInt(error.count);
      return acc;
    }, {} as Record<string, number>);
  }
}