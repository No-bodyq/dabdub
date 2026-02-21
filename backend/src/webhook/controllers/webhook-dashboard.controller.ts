import {
  Controller,
  Get,
  HttpStatus,
  Version,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WebhookDashboardService } from '../services/webhook-dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@ApiTags('Webhook Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('webhooks/dashboard')
export class WebhookDashboardController {
  constructor(
    private readonly dashboardService: WebhookDashboardService,
  ) {}

  @Version('1')
  @Get('metrics')
  @ApiOperation({
    summary: 'Get comprehensive dashboard metrics',
    description: 'Retrieve all dashboard metrics including overview, recent activity, alerts, and performance data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard metrics retrieved successfully',
  })
  async getDashboardMetrics() {
    return this.dashboardService.getDashboardMetrics();
  }

  @Version('1')
  @Get('status-summary')
  @ApiOperation({
    summary: 'Get webhook status summary',
    description: 'Get counts of webhooks by health status (healthy, degraded, unhealthy, disabled)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status summary retrieved successfully',
  })
  async getStatusSummary() {
    return this.dashboardService.getWebhookStatusSummary();
  }

  @Version('1')
  @Get('health-score')
  @ApiOperation({
    summary: 'Get system health score',
    description: 'Get overall system health score with contributing factors',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health score retrieved successfully',
  })
  async getHealthScore() {
    return this.dashboardService.getSystemHealthScore();
  }
}