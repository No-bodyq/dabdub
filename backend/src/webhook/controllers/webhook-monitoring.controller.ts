import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpStatus,
  Version,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WebhookMonitoringService } from '../services/webhook-monitoring.service';
import { WebhookRetryService } from '../services/webhook-retry.service';
import { WebhookTestingService } from '../services/webhook-testing.service';
import {
  WebhookDeliveryQueryDto,
  WebhookAnalyticsDto,
  WebhookHealthStatusDto,
  BulkRetryRequestDto,
  WebhookTestResultDto,
} from '../dto/webhook-monitoring.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@ApiTags('Webhook Monitoring')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhookMonitoringController {
  constructor(
    private readonly monitoringService: WebhookMonitoringService,
    private readonly retryService: WebhookRetryService,
    private readonly testingService: WebhookTestingService,
  ) {}

  @Version('1')
  @Get(':id/deliveries')
  @ApiOperation({
    summary: 'Get webhook delivery logs',
    description: 'Retrieve paginated delivery logs for a specific webhook with filtering options',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery logs retrieved successfully',
  })
  async getDeliveryLogs(
    @Param('id') webhookId: string,
    @Query() query: WebhookDeliveryQueryDto,
  ) {
    return this.monitoringService.getDeliveryLogs(webhookId, query);
  }

  @Version('1')
  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get webhook analytics',
    description: 'Retrieve comprehensive analytics for webhook delivery performance',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: WebhookAnalyticsDto,
  })
  async getAnalytics(
    @Param('id') webhookId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<WebhookAnalyticsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.monitoringService.getWebhookAnalytics(webhookId, start, end);
  }

  @Version('1')
  @Get(':id/health')
  @ApiOperation({
    summary: 'Get webhook health status',
    description: 'Retrieve current health status and metrics for a webhook',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status retrieved successfully',
    type: WebhookHealthStatusDto,
  })
  async getHealthStatus(
    @Param('id') webhookId: string,
  ): Promise<WebhookHealthStatusDto> {
    return this.monitoringService.getWebhookHealthStatus(webhookId);
  }

  @Version('1')
  @Get('health/overview')
  @ApiOperation({
    summary: 'Get health overview for all webhooks',
    description: 'Retrieve health status for all configured webhooks',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health overview retrieved successfully',
    type: [WebhookHealthStatusDto],
  })
  async getHealthOverview(): Promise<WebhookHealthStatusDto[]> {
    return this.monitoringService.getAllWebhooksHealthStatus();
  }

  @Version('1')
  @Get(':id/trends')
  @ApiOperation({
    summary: 'Get webhook delivery trends',
    description: 'Retrieve delivery trends over time for performance analysis',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to analyze (default: 7)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery trends retrieved successfully',
  })
  async getDeliveryTrends(
    @Param('id') webhookId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 7;
    return this.monitoringService.getDeliveryTrends(webhookId, numDays);
  }

  @Version('1')
  @Get('failed-deliveries')
  @ApiOperation({
    summary: 'Get failed deliveries across all webhooks',
    description: 'Retrieve recent failed deliveries for monitoring and troubleshooting',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results (default: 100)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Failed deliveries retrieved successfully',
  })
  async getFailedDeliveries(
    @Query('limit') limit?: string,
  ) {
    const maxResults = limit ? parseInt(limit, 10) : 100;
    return this.monitoringService.getFailedDeliveries(undefined, maxResults);
  }

  @Version('1')
  @Get(':id/failed-deliveries')
  @ApiOperation({
    summary: 'Get failed deliveries for a specific webhook',
    description: 'Retrieve failed deliveries for a specific webhook',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results (default: 100)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Failed deliveries retrieved successfully',
  })
  async getWebhookFailedDeliveries(
    @Param('id') webhookId: string,
    @Query('limit') limit?: string,
  ) {
    const maxResults = limit ? parseInt(limit, 10) : 100;
    return this.monitoringService.getFailedDeliveries(webhookId, maxResults);
  }

  @Version('1')
  @Post(':id/retry/:deliveryId')
  @ApiOperation({
    summary: 'Retry a specific delivery',
    description: 'Manually retry a failed webhook delivery',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiParam({ name: 'deliveryId', description: 'Delivery log ID to retry' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retry initiated successfully',
  })
  async retryDelivery(
    @Param('id') webhookId: string,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.retryService.retryDelivery(deliveryId);
  }

  @Version('1')
  @Post(':id/retry/bulk')
  @ApiOperation({
    summary: 'Bulk retry multiple deliveries',
    description: 'Retry multiple failed deliveries at once',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk retry initiated successfully',
  })
  async bulkRetryDeliveries(
    @Param('id') webhookId: string,
    @Body() request: BulkRetryRequestDto,
  ) {
    return this.retryService.bulkRetryDeliveries(webhookId, request);
  }

  @Version('1')
  @Post(':id/retry/all-failed')
  @ApiOperation({
    summary: 'Retry all failed deliveries',
    description: 'Retry all failed deliveries for a webhook',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'maxAge', required: false, description: 'Only retry failures newer than this date (ISO 8601)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retry all failed deliveries initiated successfully',
  })
  async retryAllFailedDeliveries(
    @Param('id') webhookId: string,
    @Query('maxAge') maxAge?: string,
  ) {
    const maxAgeDate = maxAge ? new Date(maxAge) : undefined;
    return this.retryService.retryAllFailedDeliveries(webhookId, maxAgeDate);
  }

  @Version('1')
  @Get(':id/retryable')
  @ApiOperation({
    summary: 'Get retryable deliveries',
    description: 'Get list of failed deliveries that can be retried',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results (default: 100)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retryable deliveries retrieved successfully',
  })
  async getRetryableDeliveries(
    @Param('id') webhookId: string,
    @Query('limit') limit?: string,
  ) {
    const maxResults = limit ? parseInt(limit, 10) : 100;
    return this.retryService.getRetryableDeliveries(webhookId, maxResults);
  }

  @Version('1')
  @Post(':id/test')
  @ApiOperation({
    summary: 'Test webhook endpoint',
    description: 'Send a test request to the webhook endpoint to verify connectivity',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test completed successfully',
    type: WebhookTestResultDto,
  })
  async testWebhook(
    @Param('id') webhookId: string,
    @Body() customPayload?: any,
  ): Promise<WebhookTestResultDto> {
    return this.testingService.testWebhookEndpoint(webhookId, customPayload);
  }

  @Version('1')
  @Post(':id/validate')
  @ApiOperation({
    summary: 'Validate webhook endpoint',
    description: 'Perform comprehensive validation of webhook endpoint configuration and connectivity',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed successfully',
  })
  async validateWebhook(@Param('id') webhookId: string) {
    return this.testingService.validateWebhookEndpoint(webhookId);
  }

  @Version('1')
  @Get(':id/test-history')
  @ApiOperation({
    summary: 'Get webhook test history',
    description: 'Retrieve history of webhook tests performed',
  })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results (default: 50)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test history retrieved successfully',
  })
  async getTestHistory(
    @Param('id') webhookId: string,
    @Query('limit') limit?: string,
  ) {
    const maxResults = limit ? parseInt(limit, 10) : 50;
    return this.testingService.getTestHistory(webhookId, maxResults);
  }
}