import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { ExportJobPayload } from '../payloads';
import { RedisService } from '../../../common/redis';

const QUEUE = 'exports';
const IDEMPOTENCY_PREFIX = 'job:processed:exports:';

@Processor(QUEUE)
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(job: Job<ExportJobPayload, unknown, string>): Promise<unknown> {
    const { correlationId, jobId } = job.data;
    const idempotencyKey = `${IDEMPOTENCY_PREFIX}${job.id}`;

    const alreadyProcessed = await this.redis.get(idempotencyKey);
    if (alreadyProcessed === '1') {
      this.logger.log(`Export job ${job.id} already processed (idempotent skip)`, {
        correlationId,
        jobId,
      });
      return { skipped: true, reason: 'idempotent' };
    }

    this.logger.log(`Processing export job ${job.id}`, { correlationId, jobId });
    await job.updateProgress(20);

    // Placeholder: actual export generation would go here
    await job.updateProgress(100);
    await this.redis.set(idempotencyKey, '1', 86400);

    return { jobId, status: 'export_ready' };
  }
}
