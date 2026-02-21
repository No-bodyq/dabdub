import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RequirePermissionGuard } from '../../auth/guards/require-permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JobsService, QUEUE_NAMES } from './jobs.service';
import type { JobStatusResponseDto } from './dto/job-status-response.dto';
import type { QueueStatsDto } from './dto/queue-stats.dto';

@Controller('api/v1/jobs')
@UseGuards(JwtGuard, RequirePermissionGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('queues/stats')
  @RequirePermission('analytics:read')
  async getAllQueueStats(): Promise<Record<string, QueueStatsDto>> {
    return this.jobsService.getAllQueueStats();
  }

  @Get(':jobId/status')
  @RequirePermission('analytics:read')
  async getStatus(
    @Param('jobId') jobId: string,
    @Query('queue') queue?: string,
  ): Promise<JobStatusResponseDto> {
    if (queue) {
      const valid = QUEUE_NAMES.includes(queue as any);
      if (!valid) throw new NotFoundException(`Queue ${queue} not found`);
      const status = await this.jobsService.getStatus(queue, jobId);
      if (!status) throw new NotFoundException(`Job ${jobId} not found`);
      return status;
    }
    const status = await this.jobsService.getStatusFromAnyQueue(jobId);
    if (!status) throw new NotFoundException(`Job ${jobId} not found`);
    return status;
  }
}
