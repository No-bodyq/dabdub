import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { WebhookConfigurationEntity } from '../../database/entities/webhook-configuration.entity';
import {
  WebhookDeliveryLogEntity,
  WebhookDeliveryStatus,
} from '../../database/entities/webhook-delivery-log.entity';
import { WebhookTestResultDto } from '../dto/webhook-monitoring.dto';

export interface WebhookTestPayload {
  event: string;
  data?: any;
  timestamp?: string;
  testId?: string;
}

@Injectable()
export class WebhookTestingService {
  private readonly logger = new Logger(WebhookTestingService.name);

  constructor(
    @InjectRepository(WebhookConfigurationEntity)
    private readonly webhookRepository: Repository<WebhookConfigurationEntity>,
    @InjectRepository(WebhookDeliveryLogEntity)
    private readonly deliveryLogRepository: Repository<WebhookDeliveryLogEntity>,
  ) {}

  async testWebhookEndpoint(
    webhookId: string,
    customPayload?: WebhookTestPayload,
  ): Promise<WebhookTestResultDto> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const testId = randomUUID();
    const testPayload = customPayload || this.createDefaultTestPayload();
    
    // Add test metadata
    const fullPayload = {
      ...testPayload,
      testId,
      timestamp: new Date().toISOString(),
      webhookId,
    };

    const deliveryId = randomUUID();
    const startTime = Date.now();

    // Create delivery log entry
    const deliveryLog = this.deliveryLogRepository.create({
      id: deliveryId,
      webhookConfigId: webhookId,
      merchantId: webhook.merchantId,
      event: 'webhook.test',
      payload: fullPayload,
      status: WebhookDeliveryStatus.PENDING,
      attemptNumber: 1,
      maxAttempts: 1,
      requestId: testId,
    });

    try {
      // Send the test request
      const result = await this.sendTestRequest(webhook, fullPayload, deliveryId);
      
      // Update delivery log with results
      deliveryLog.status = result.success ? WebhookDeliveryStatus.DELIVERED : WebhookDeliveryStatus.FAILED;
      deliveryLog.httpStatusCode = result.httpStatusCode;
      deliveryLog.responseTimeMs = Date.now() - startTime;
      deliveryLog.responseBody = result.responseBody;
      deliveryLog.errorMessage = result.errorMessage;
      deliveryLog.sentAt = new Date();
      
      if (result.success) {
        deliveryLog.deliveredAt = new Date();
      } else {
        deliveryLog.failedAt = new Date();
      }

      await this.deliveryLogRepository.save(deliveryLog);

      return {
        deliveryId,
        status: result.success ? 'success' : 'failed',
        httpStatusCode: result.httpStatusCode,
        responseTimeMs: deliveryLog.responseTimeMs,
        errorMessage: result.errorMessage,
        responseBody: result.responseBody,
        testedAt: new Date(),
      };

    } catch (error) {
      // Handle unexpected errors
      deliveryLog.status = WebhookDeliveryStatus.FAILED;
      deliveryLog.responseTimeMs = Date.now() - startTime;
      deliveryLog.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deliveryLog.failedAt = new Date();

      await this.deliveryLogRepository.save(deliveryLog);

      return {
        deliveryId,
        status: 'failed',
        responseTimeMs: deliveryLog.responseTimeMs,
        errorMessage: deliveryLog.errorMessage,
        testedAt: new Date(),
      };
    }
  }

  async validateWebhookEndpoint(webhookId: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Test basic connectivity
    try {
      const testResult = await this.testWebhookEndpoint(webhookId);
      
      if (testResult.status === 'failed') {
        issues.push(`Endpoint test failed: ${testResult.errorMessage}`);
      }

      if (testResult.responseTimeMs && testResult.responseTimeMs > 5000) {
        issues.push('Response time is too slow (>5 seconds)');
        recommendations.push('Consider optimizing your webhook handler for faster response times');
      }

      if (testResult.httpStatusCode && testResult.httpStatusCode !== 200) {
        issues.push(`Unexpected HTTP status code: ${testResult.httpStatusCode}`);
        recommendations.push('Ensure your webhook endpoint returns HTTP 200 for successful processing');
      }

    } catch (error) {
      issues.push(`Failed to test endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check URL format
    if (!webhook.url.startsWith('https://')) {
      issues.push('Webhook URL should use HTTPS for security');
      recommendations.push('Update your webhook URL to use HTTPS protocol');
    }

    // Check if webhook has been failing recently
    const recentFailures = await this.deliveryLogRepository.count({
      where: {
        webhookConfigId: webhookId,
        status: WebhookDeliveryStatus.FAILED,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    });

    if (recentFailures > 10) {
      issues.push(`High failure rate: ${recentFailures} failures in the last 24 hours`);
      recommendations.push('Check your webhook endpoint logs for errors and ensure it\'s properly handling requests');
    }

    // Check configuration
    if (!webhook.secret) {
      recommendations.push('Consider adding a webhook secret for signature verification');
    }

    if (webhook.timeout < 5000) {
      recommendations.push('Consider increasing the timeout value for better reliability');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  async getTestHistory(
    webhookId: string,
    limit: number = 50,
  ): Promise<WebhookDeliveryLogEntity[]> {
    return this.deliveryLogRepository.find({
      where: {
        webhookConfigId: webhookId,
        event: 'webhook.test',
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private async sendTestRequest(
    webhook: WebhookConfigurationEntity,
    payload: any,
    deliveryId: string,
  ): Promise<{
    success: boolean;
    httpStatusCode?: number;
    responseBody?: string;
    errorMessage?: string;
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), webhook.timeout || 5000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Dabdub-Webhook-Test/1.0',
        'X-Dabdub-Event': 'webhook.test',
        'X-Dabdub-Delivery': deliveryId,
        'X-Dabdub-Test': 'true',
      };

      // Add custom headers if configured
      if (webhook.headers) {
        Object.assign(headers, webhook.headers);
      }

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = this.createTestSignature(payload, webhook.secret);
        headers['X-Dabdub-Signature'] = signature;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const responseBody = await response.text();

      return {
        success: response.status >= 200 && response.status < 300,
        httpStatusCode: response.status,
        responseBody: responseBody.substring(0, 1000), // Limit response body size
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            errorMessage: 'Request timeout',
          };
        }
        return {
          success: false,
          errorMessage: error.message,
        };
      }
      return {
        success: false,
        errorMessage: 'Unknown error occurred',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private createDefaultTestPayload(): WebhookTestPayload {
    return {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook from Dabdub',
        timestamp: new Date().toISOString(),
        test: true,
      },
    };
  }

  private createTestSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');
    
    return `t=${timestamp},v1=${signature}`;
  }
}