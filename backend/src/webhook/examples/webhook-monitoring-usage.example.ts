/**
 * Webhook Monitoring System Usage Examples
 * 
 * This file demonstrates how to use the comprehensive webhook monitoring
 * and management system for tracking delivery performance, handling retries,
 * and maintaining webhook health.
 */

import { Injectable } from '@nestjs/common';
import { WebhookMonitoringService } from '../services/webhook-monitoring.service';
import { WebhookRetryService } from '../services/webhook-retry.service';
import { WebhookTestingService } from '../services/webhook-testing.service';
import { WebhookDashboardService } from '../services/webhook-dashboard.service';
import { WebhookDeliveryQueryDto } from '../dto/webhook-monitoring.dto';

@Injectable()
export class WebhookMonitoringUsageExample {
  constructor(
    private readonly monitoringService: WebhookMonitoringService,
    private readonly retryService: WebhookRetryService,
    private readonly testingService: WebhookTestingService,
    private readonly dashboardService: WebhookDashboardService,
  ) {}

  /**
   * Example 1: Get comprehensive webhook analytics
   */
  async getWebhookPerformanceReport(webhookId: string) {
    // Get analytics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const analytics = await this.monitoringService.getWebhookAnalytics(
      webhookId,
      thirtyDaysAgo,
      new Date(),
    );

    console.log('📊 Webhook Performance Report');
    console.log(`Success Rate: ${analytics.successRate}%`);
    console.log(`Total Deliveries: ${analytics.totalDeliveries}`);
    console.log(`Average Response Time: ${analytics.averageResponseTime}ms`);
    console.log(`P95 Response Time: ${analytics.p95ResponseTime}ms`);
    
    // Check if performance is concerning
    if (analytics.successRate < 95) {
      console.log('⚠️  Warning: Success rate is below 95%');
    }
    
    if (analytics.averageResponseTime > 3000) {
      console.log('⚠️  Warning: Average response time is above 3 seconds');
    }

    return analytics;
  }

  /**
   * Example 2: Monitor webhook health and get recommendations
   */
  async checkWebhookHealth(webhookId: string) {
    const healthStatus = await this.monitoringService.getWebhookHealthStatus(webhookId);
    
    console.log('🏥 Webhook Health Check');
    console.log(`Status: ${healthStatus.status}`);
    console.log(`Success Rate (24h): ${healthStatus.successRate24h}%`);
    console.log(`Consecutive Failures: ${healthStatus.consecutiveFailures}`);
    
    // Provide actionable insights
    switch (healthStatus.status) {
      case 'healthy':
        console.log('✅ Webhook is performing well');
        break;
      case 'degraded':
        console.log('⚠️  Webhook performance is degraded - monitor closely');
        break;
      case 'unhealthy':
        console.log('❌ Webhook is unhealthy - immediate attention required');
        break;
      case 'disabled':
        console.log('🚫 Webhook is disabled');
        break;
    }

    return healthStatus;
  }

  /**
   * Example 3: Get and analyze delivery logs with filtering
   */
  async analyzeRecentDeliveries(webhookId: string) {
    const query: WebhookDeliveryQueryDto = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      limit: 100,
      page: 1,
    };

    const deliveries = await this.monitoringService.getDeliveryLogs(webhookId, query);
    
    console.log('📋 Recent Delivery Analysis');
    console.log(`Total Deliveries: ${deliveries.total}`);
    console.log(`Page ${deliveries.page} of ${deliveries.totalPages}`);
    
    // Analyze delivery patterns
    const statusCounts = deliveries.data.reduce((acc, delivery) => {
      acc[delivery.status] = (acc[delivery.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Status Distribution:', statusCounts);
    
    // Find slow deliveries
    const slowDeliveries = deliveries.data.filter(d => 
      d.responseTimeMs && d.responseTimeMs > 5000
    );
    
    if (slowDeliveries.length > 0) {
      console.log(`⏱️  Found ${slowDeliveries.length} slow deliveries (>5s)`);
    }

    return deliveries;
  }

  /**
   * Example 4: Handle failed deliveries with intelligent retry
   */
  async handleFailedDeliveries(webhookId: string) {
    // Get failed deliveries that can be retried
    const retryableDeliveries = await this.retryService.getRetryableDeliveries(webhookId, 50);
    
    console.log('🔄 Failed Delivery Management');
    console.log(`Found ${retryableDeliveries.length} retryable deliveries`);
    
    if (retryableDeliveries.length === 0) {
      console.log('✅ No failed deliveries to retry');
      return;
    }

    // Analyze failure patterns
    const errorPatterns = retryableDeliveries.reduce((acc, delivery) => {
      const errorKey = delivery.httpStatusCode?.toString() || 'timeout';
      acc[errorKey] = (acc[errorKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Error Patterns:', errorPatterns);
    
    // Retry recent failures (last 24 hours)
    const recentFailures = retryableDeliveries.filter(delivery => 
      delivery.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentFailures.length > 0) {
      const retryResult = await this.retryService.bulkRetryDeliveries(webhookId, {
        deliveryIds: recentFailures.map(d => d.id),
        reason: 'Automated retry of recent failures',
      });
      
      console.log(`Retry Results: ${retryResult.summary.queued} queued, ${retryResult.summary.failed} failed`);
    }

    return { retryableDeliveries, errorPatterns };
  }

  /**
   * Example 5: Test webhook endpoint and validate configuration
   */
  async validateWebhookSetup(webhookId: string) {
    console.log('🧪 Webhook Validation');
    
    // Test endpoint connectivity
    const testResult = await this.testingService.testWebhookEndpoint(webhookId);
    
    console.log(`Test Status: ${testResult.status}`);
    console.log(`Response Time: ${testResult.responseTimeMs}ms`);
    
    if (testResult.status === 'failed') {
      console.log(`❌ Test failed: ${testResult.errorMessage}`);
    } else {
      console.log('✅ Endpoint is responding correctly');
    }
    
    // Validate configuration
    const validation = await this.testingService.validateWebhookEndpoint(webhookId);
    
    console.log(`Configuration Valid: ${validation.isValid}`);
    
    if (validation.issues.length > 0) {
      console.log('Issues found:');
      validation.issues.forEach(issue => console.log(`  ❌ ${issue}`));
    }
    
    if (validation.recommendations.length > 0) {
      console.log('Recommendations:');
      validation.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }

    return { testResult, validation };
  }

  /**
   * Example 6: Get system-wide dashboard overview
   */
  async getSystemOverview() {
    const dashboardMetrics = await this.dashboardService.getDashboardMetrics();
    
    console.log('🎛️  System Dashboard Overview');
    console.log(`Total Webhooks: ${dashboardMetrics.overview.totalWebhooks}`);
    console.log(`Active Webhooks: ${dashboardMetrics.overview.activeWebhooks}`);
    console.log(`Healthy Webhooks: ${dashboardMetrics.overview.healthyWebhooks}`);
    console.log(`24h Success Rate: ${dashboardMetrics.overview.overallSuccessRate24h}%`);
    console.log(`24h Deliveries: ${dashboardMetrics.overview.totalDeliveries24h}`);
    
    // Show recent activity
    console.log('\n📈 Recent Activity:');
    console.log(`Recent Deliveries: ${dashboardMetrics.recentActivity.recentDeliveries.length}`);
    console.log(`Recent Failures: ${dashboardMetrics.recentActivity.recentFailures.length}`);
    
    // Show alerts
    if (dashboardMetrics.alerts.length > 0) {
      console.log('\n🚨 Active Alerts:');
      dashboardMetrics.alerts.forEach(alert => {
        console.log(`  ${alert.severity.toUpperCase()}: ${alert.message} (${alert.webhookUrl})`);
      });
    } else {
      console.log('\n✅ No active alerts');
    }
    
    // Show top performers
    if (dashboardMetrics.topPerformers.length > 0) {
      console.log('\n🏆 Top Performing Webhooks:');
      dashboardMetrics.topPerformers.forEach((performer, index) => {
        console.log(`  ${index + 1}. ${performer.webhookUrl} - ${performer.successRate}% success`);
      });
    }

    return dashboardMetrics;
  }

  /**
   * Example 7: Monitor delivery trends and performance over time
   */
  async analyzeDeliveryTrends(webhookId: string, days: number = 7) {
    const trends = await this.monitoringService.getDeliveryTrends(webhookId, days);
    
    console.log(`📊 Delivery Trends (Last ${days} days)`);
    
    trends.forEach(trend => {
      const total = trend.successful + trend.failed;
      const successRate = total > 0 ? (trend.successful / total) * 100 : 0;
      
      console.log(`${trend.date}: ${total} deliveries, ${successRate.toFixed(1)}% success, ${trend.avgResponseTime}ms avg`);
    });
    
    // Calculate trend direction
    if (trends.length >= 2) {
      const recent = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      
      const recentSuccessRate = recent.successful / (recent.successful + recent.failed) * 100;
      const previousSuccessRate = previous.successful / (previous.successful + previous.failed) * 100;
      
      if (recentSuccessRate > previousSuccessRate) {
        console.log('📈 Trend: Improving');
      } else if (recentSuccessRate < previousSuccessRate) {
        console.log('📉 Trend: Declining');
      } else {
        console.log('➡️  Trend: Stable');
      }
    }

    return trends;
  }

  /**
   * Example 8: Comprehensive webhook health check with automated actions
   */
  async performHealthCheckWithActions(webhookId: string) {
    console.log('🔍 Comprehensive Health Check');
    
    // 1. Check current health status
    const health = await this.checkWebhookHealth(webhookId);
    
    // 2. Get recent performance
    const analytics = await this.getWebhookPerformanceReport(webhookId);
    
    // 3. Test endpoint
    const { testResult, validation } = await this.validateWebhookSetup(webhookId);
    
    // 4. Automated actions based on health
    const actions = [];
    
    if (health.status === 'unhealthy') {
      // Retry recent failures
      const retryResult = await this.handleFailedDeliveries(webhookId);
      actions.push(`Retried ${retryResult.retryableDeliveries.length} failed deliveries`);
    }
    
    if (analytics.successRate < 90) {
      actions.push('Recommended: Review endpoint logs and fix issues');
    }
    
    if (analytics.averageResponseTime > 5000) {
      actions.push('Recommended: Optimize endpoint response time');
    }
    
    if (!validation.isValid) {
      actions.push('Recommended: Fix configuration issues');
    }
    
    console.log('\n🎯 Automated Actions Taken:');
    actions.forEach(action => console.log(`  • ${action}`));
    
    return {
      health,
      analytics,
      testResult,
      validation,
      actions,
    };
  }
}

/**
 * Usage in a controller or service:
 * 
 * @Controller('webhook-examples')
 * export class WebhookExampleController {
 *   constructor(private readonly examples: WebhookMonitoringUsageExample) {}
 * 
 *   @Get(':id/health-check')
 *   async healthCheck(@Param('id') webhookId: string) {
 *     return this.examples.performHealthCheckWithActions(webhookId);
 *   }
 * 
 *   @Get('dashboard')
 *   async dashboard() {
 *     return this.examples.getSystemOverview();
 *   }
 * }
 */