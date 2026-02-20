import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookConfigurationEntity } from '../../database/entities/webhook-configuration.entity';
import {
  WebhookDeliveryLogEntity,
  WebhookDeliveryStatus,
} from '../../database/entities/webhook-delivery-log.entity';

export interface DashboardMetrics {
  overview: {
    totalWebhooks: number;
    activeWebhooks: number;
    healthyWebhooks: number;
    unhealthyWebhooks: number;
    totalDeliveries24h: number;
    successfulDeliveries24h: number;
    failedDeliveries24h: number;
    averageResponseTime24h: number;
    overallSuccessRate24h: number;
  };
  recentActivity: {
    recentDeliveries: Array<{
      id: string;
      webhookId: string;
      webhookUrl: string;
      event: string;
      status: WebhookDeliveryStatus;
      responseTime?: number;
      createdAt: Date;
    }>;
    recentFailures: Array<{
      id: string;
      webhookId: string;
      webhookUrl: string;
      event: string;
      errorMessage?: string;
      createdAt: Date;
    }>;
  };
  alerts: Array<{
    type: 'high_failure_rate' | 'slow_response' | 'webhook_down' | 'consecutive_failures';
    severity: 'low' | 'medium' | 'high' | 'critical';
    webhookId: string;
    webhookUrl: string;
    message: string;
    createdAt: Date;
  }>;
  topPerformers: Array<{
    webhookId: string;
    webhookUrl: string;
    successRate: number;
    averageResponseTime: number;
    totalDeliveries: number;
  }>;
  slowestEndpoints: Array<{
    webhookId: string;
    webhookUrl: string;
    averageResponseTime: number;
    p95ResponseTime: number;
    totalDeliveries: number;
  }>;
}

@Injectable()
export class WebhookDashboardService {
  private readonly logger = new Logger(WebhookDashboardService.name);

  constructor(
    @InjectRepository(WebhookConfigurationEntity)
    private readonly webhookRepository: Repository<WebhookConfigurationEntity>,
    @InjectRepository(WebhookDeliveryLogEntity)
    private readonly deliveryLogRepository: Repository<WebhookDeliveryLogEntity>,
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get overview metrics
    const overview = await this.getOverviewMetrics(last24Hours);
    
    // Get recent activity
    const recentActivity = await this.getRecentActivity();
    
    // Generate alerts
    const alerts = await this.generateAlerts();
    
    // Get performance metrics
    const topPerformers = await this.getTopPerformers(last24Hours);
    const slowestEndpoints = await this.getSlowestEndpoints(last24Hours);

    return {
      overview,
      recentActivity,
      alerts,
      topPerformers,
      slowestEndpoints,
    };
  }

  async getWebhookStatusSummary(): Promise<{
    healthy: number;
    degraded: number;
    unhealthy: number;
    disabled: number;
  }> {
    const webhooks = await this.webhookRepository.find();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const summary = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      disabled: 0,
    };

    for (const webhook of webhooks) {
      if (!webhook.isActive) {
        summary.disabled++;
        continue;
      }

      // Calculate 24h success rate
      const stats = await this.deliveryLogRepository
        .createQueryBuilder('log')
        .select([
          'COUNT(*) as total',
          'COUNT(CASE WHEN status = :delivered THEN 1 END) as successful',
        ])
        .where('log.webhookConfigId = :webhookId', { webhookId: webhook.id })
        .andWhere('log.createdAt >= :last24Hours', { last24Hours })
        .setParameter('delivered', WebhookDeliveryStatus.DELIVERED)
        .getRawOne();

      const total = parseInt(stats.total) || 0;
      const successful = parseInt(stats.successful) || 0;
      const successRate = total > 0 ? (successful / total) * 100 : 100;

      if (successRate >= 95 && webhook.consecutiveFailures < 3) {
        summary.healthy++;
      } else if (successRate >= 85 && webhook.consecutiveFailures < 5) {
        summary.degraded++;
      } else {
        summary.unhealthy++;
      }
    }

    return summary;
  }

  async getSystemHealthScore(): Promise<{
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{
      name: string;
      score: number;
      weight: number;
      description: string;
    }>;
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Calculate various health factors
    const factors = [];

    // Overall success rate (40% weight)
    const overallStats = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN status = :delivered THEN 1 END) as successful',
      ])
      .where('log.createdAt >= :last24Hours', { last24Hours })
      .setParameter('delivered', WebhookDeliveryStatus.DELIVERED)
      .getRawOne();

    const totalDeliveries = parseInt(overallStats.total) || 0;
    const successfulDeliveries = parseInt(overallStats.successful) || 0;
    const overallSuccessRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 100;
    
    factors.push({
      name: 'Success Rate',
      score: Math.min(100, overallSuccessRate),
      weight: 0.4,
      description: `${overallSuccessRate.toFixed(1)}% of deliveries successful in last 24h`,
    });

    // Average response time (25% weight)
    const avgResponseTime = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select('AVG(response_time_ms) as avg_response_time')
      .where('log.createdAt >= :last24Hours', { last24Hours })
      .andWhere('log.responseTimeMs IS NOT NULL')
      .getRawOne();

    const responseTime = parseFloat(avgResponseTime.avg_response_time) || 0;
    const responseTimeScore = Math.max(0, 100 - (responseTime / 50)); // 5000ms = 0 score, 0ms = 100 score
    
    factors.push({
      name: 'Response Time',
      score: Math.min(100, responseTimeScore),
      weight: 0.25,
      description: `Average response time: ${responseTime.toFixed(0)}ms`,
    });

    // Webhook availability (20% weight)
    const statusSummary = await this.getWebhookStatusSummary();
    const totalWebhooks = statusSummary.healthy + statusSummary.degraded + statusSummary.unhealthy + statusSummary.disabled;
    const availabilityScore = totalWebhooks > 0 ? ((statusSummary.healthy + statusSummary.degraded) / totalWebhooks) * 100 : 100;
    
    factors.push({
      name: 'Webhook Availability',
      score: availabilityScore,
      weight: 0.2,
      description: `${statusSummary.healthy + statusSummary.degraded}/${totalWebhooks} webhooks operational`,
    });

    // Error diversity (15% weight) - fewer error types is better
    const errorTypes = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT COALESCE(CAST(http_status_code AS TEXT), \'timeout\')) as error_types')
      .where('log.createdAt >= :last24Hours', { last24Hours })
      .andWhere('log.status = :failed', { failed: WebhookDeliveryStatus.FAILED })
      .getRawOne();

    const errorTypeCount = parseInt(errorTypes.error_types) || 0;
    const errorDiversityScore = Math.max(0, 100 - (errorTypeCount * 10)); // Each error type reduces score by 10
    
    factors.push({
      name: 'Error Diversity',
      score: errorDiversityScore,
      weight: 0.15,
      description: `${errorTypeCount} different error types encountered`,
    });

    // Calculate weighted score
    const weightedScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (weightedScore >= 90) status = 'excellent';
    else if (weightedScore >= 75) status = 'good';
    else if (weightedScore >= 60) status = 'fair';
    else status = 'poor';

    return {
      score: Math.round(weightedScore),
      status,
      factors,
    };
  }

  private async getOverviewMetrics(last24Hours: Date) {
    // Get webhook counts
    const webhookCounts = await this.webhookRepository
      .createQueryBuilder('webhook')
      .select([
        'COUNT(*) as total_webhooks',
        'COUNT(CASE WHEN is_active = true THEN 1 END) as active_webhooks',
      ])
      .getRawOne();

    // Get delivery stats for last 24h
    const deliveryStats = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .select([
        'COUNT(*) as total_deliveries',
        'COUNT(CASE WHEN status = :delivered THEN 1 END) as successful_deliveries',
        'COUNT(CASE WHEN status = :failed THEN 1 END) as failed_deliveries',
        'AVG(CASE WHEN response_time_ms IS NOT NULL THEN response_time_ms END) as avg_response_time',
      ])
      .where('log.createdAt >= :last24Hours', { last24Hours })
      .setParameter('delivered', WebhookDeliveryStatus.DELIVERED)
      .setParameter('failed', WebhookDeliveryStatus.FAILED)
      .getRawOne();

    // Get health status counts
    const statusSummary = await this.getWebhookStatusSummary();

    const totalDeliveries = parseInt(deliveryStats.total_deliveries) || 0;
    const successfulDeliveries = parseInt(deliveryStats.successful_deliveries) || 0;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    return {
      totalWebhooks: parseInt(webhookCounts.total_webhooks) || 0,
      activeWebhooks: parseInt(webhookCounts.active_webhooks) || 0,
      healthyWebhooks: statusSummary.healthy,
      unhealthyWebhooks: statusSummary.unhealthy + statusSummary.degraded,
      totalDeliveries24h: totalDeliveries,
      successfulDeliveries24h: successfulDeliveries,
      failedDeliveries24h: parseInt(deliveryStats.failed_deliveries) || 0,
      averageResponseTime24h: Math.round(parseFloat(deliveryStats.avg_response_time) || 0),
      overallSuccessRate24h: Math.round(successRate * 100) / 100,
    };
  }

  private async getRecentActivity() {
    // Get recent deliveries
    const recentDeliveries = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.webhookConfiguration', 'webhook')
      .select([
        'log.id',
        'log.webhookConfigId',
        'log.event',
        'log.status',
        'log.responseTimeMs',
        'log.createdAt',
        'webhook.url',
      ])
      .orderBy('log.createdAt', 'DESC')
      .limit(20)
      .getMany();

    // Get recent failures
    const recentFailures = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.webhookConfiguration', 'webhook')
      .select([
        'log.id',
        'log.webhookConfigId',
        'log.event',
        'log.errorMessage',
        'log.createdAt',
        'webhook.url',
      ])
      .where('log.status = :failed', { failed: WebhookDeliveryStatus.FAILED })
      .orderBy('log.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return {
      recentDeliveries: recentDeliveries.map(delivery => ({
        id: delivery.id,
        webhookId: delivery.webhookConfigId,
        webhookUrl: delivery.webhookConfiguration?.url || 'Unknown',
        event: delivery.event,
        status: delivery.status,
        responseTime: delivery.responseTimeMs,
        createdAt: delivery.createdAt,
      })),
      recentFailures: recentFailures.map(failure => ({
        id: failure.id,
        webhookId: failure.webhookConfigId,
        webhookUrl: failure.webhookConfiguration?.url || 'Unknown',
        event: failure.event,
        errorMessage: failure.errorMessage,
        createdAt: failure.createdAt,
      })),
    };
  }

  private async generateAlerts() {
    const alerts = [];
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for webhooks with high failure rates
    const highFailureWebhooks = await this.webhookRepository
      .createQueryBuilder('webhook')
      .where('webhook.isActive = true')
      .andWhere('webhook.consecutiveFailures >= 5')
      .getMany();

    for (const webhook of highFailureWebhooks) {
      alerts.push({
        type: 'consecutive_failures' as const,
        severity: webhook.consecutiveFailures >= 10 ? 'critical' as const : 'high' as const,
        webhookId: webhook.id,
        webhookUrl: webhook.url,
        message: `${webhook.consecutiveFailures} consecutive failures`,
        createdAt: webhook.lastFailureAt || new Date(),
      });
    }

    // Check for slow response times
    const slowWebhooks = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.webhookConfiguration', 'webhook')
      .select([
        'log.webhookConfigId',
        'webhook.url',
        'AVG(log.responseTimeMs) as avg_response_time',
      ])
      .where('log.createdAt >= :last24Hours', { last24Hours })
      .andWhere('log.responseTimeMs IS NOT NULL')
      .groupBy('log.webhookConfigId, webhook.url')
      .having('AVG(log.responseTimeMs) > 3000')
      .getRawMany();

    for (const slow of slowWebhooks) {
      const avgTime = parseFloat(slow.avg_response_time);
      alerts.push({
        type: 'slow_response' as const,
        severity: avgTime > 5000 ? 'high' as const : 'medium' as const,
        webhookId: slow.webhookConfigId,
        webhookUrl: slow.url,
        message: `Average response time: ${Math.round(avgTime)}ms`,
        createdAt: new Date(),
      });
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async getTopPerformers(last24Hours: Date) {
    const performers = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.webhookConfiguration', 'webhook')
      .select([
        'log.webhookConfigId',
        'webhook.url',
        'COUNT(*) as total_deliveries',
        'COUNT(CASE WHEN log.status = :delivered THEN 1 END) as successful_deliveries',
        'AVG(CASE WHEN log.responseTimeMs IS NOT NULL THEN log.responseTimeMs END) as avg_response_time',
      ])
      .where('log.createdAt >= :last24Hours', { last24Hours })
      .setParameter('delivered', WebhookDeliveryStatus.DELIVERED)
      .groupBy('log.webhookConfigId, webhook.url')
      .having('COUNT(*) >= 10') // Only include webhooks with significant traffic
      .orderBy('COUNT(CASE WHEN log.status = :delivered THEN 1 END) / COUNT(*)', 'DESC')
      .limit(5)
      .getRawMany();

    return performers.map(performer => {
      const total = parseInt(performer.total_deliveries);
      const successful = parseInt(performer.successful_deliveries);
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      return {
        webhookId: performer.webhookConfigId,
        webhookUrl: performer.url,
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime: Math.round(parseFloat(performer.avg_response_time) || 0),
        totalDeliveries: total,
      };
    });
  }

  private async getSlowestEndpoints(last24Hours: Date) {
    const slowest = await this.deliveryLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.webhookConfiguration', 'webhook')
      .select([
        'log.webhookConfigId',
        'webhook.url',
        'COUNT(*) as total_deliveries',
        'AVG(log.responseTimeMs) as avg_response_time',
        'PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY log.responseTimeMs) as p95_response_time',
      ])
      .where('log.createdAt >= :last24Hours', { last24Hours })
      .andWhere('log.responseTimeMs IS NOT NULL')
      .groupBy('log.webhookConfigId, webhook.url')
      .having('COUNT(*) >= 5') // Only include webhooks with some traffic
      .orderBy('AVG(log.responseTimeMs)', 'DESC')
      .limit(5)
      .getRawMany();

    return slowest.map(slow => ({
      webhookId: slow.webhookConfigId,
      webhookUrl: slow.url,
      averageResponseTime: Math.round(parseFloat(slow.avg_response_time) || 0),
      p95ResponseTime: Math.round(parseFloat(slow.p95_response_time) || 0),
      totalDeliveries: parseInt(slow.total_deliveries),
    }));
  }
}