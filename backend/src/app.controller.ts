import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseHealthIndicator } from './database/health.indicator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseHealth: DatabaseHealthIndicator,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/health')
  async health() {
    return {
      status: 'ok',
      database: await this.databaseHealth.checkHealth(),
    };
  }
}
