import {
  Controller,
  Post,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { BlockchainMonitoringJob } from '../jobs/blockchain-monitoring.job';
import { BlockchainMonitoringService } from '../services/blockchain-monitoring.service';

@Controller('blockchain/monitoring')
export class BlockchainMonitoringController {
  constructor(
    private readonly monitoringJob: BlockchainMonitoringJob,
    private readonly monitoringService: BlockchainMonitoringService,
  ) {}

  @Post('trigger/:networkId')
  async triggerManual(@Param('networkId') networkId: string) {
    try {
      await this.monitoringJob.triggerManual(networkId);
      return { message: 'Monitoring job triggered successfully' };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Get('metrics/:networkId')
  async getMetrics(@Param('networkId') networkId: string) {
    return this.monitoringService.getMetrics(networkId);
  }

  @Get('health')
  async getHealth() {
    // Basic health check for the monitoring system
    return { status: 'healthy', timestamp: new Date() };
  }
}
