import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the current health status of the application',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-20T10:30:00Z',
        uptime: 3600,
        version: '2.0.0',
        checks: {
          database: 'healthy',
          cache: 'healthy',
          external_services: 'healthy',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Application is not healthy',
  })
  async check() {
    return this.healthService.check();
  }

  @Get('deep')
  @ApiOperation({
    summary: 'Deep health check',
    description: 'Performs comprehensive health checks including dependencies',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detailed health information',
  })
  async deepCheck() {
    return this.healthService.deepCheck();
  }
}
