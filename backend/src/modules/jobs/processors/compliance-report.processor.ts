import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { ComplianceReportJobPayload } from '../payloads';
import { RedisService } from '../../../common/redis';

const QUEUE = 'compliance-reports';
const IDEMPOTENCY_PREFIX = 'job:processed:compliance-reports:';

@Processor(QUEUE)
export class ComplianceReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ComplianceReportProcessor.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(
    job: Job<ComplianceReportJobPayload, unknown, string>,
  ): Promise<unknown> {
    const { correlationId, reportId } = job.data;
    const idempotencyKey = `${IDEMPOTENCY_PREFIX}${job.id}`;

    const alreadyProcessed = await this.redis.get(idempotencyKey);
    if (alreadyProcessed === '1') {
      this.logger.log(
        `Compliance report job ${job.id} already processed (idempotent skip)`,
        { correlationId, reportId },
      );
      return { skipped: true, reason: 'idempotent' };
    }

    this.logger.log(`Processing compliance report job ${job.id}`, {
      correlationId,
      reportId,
    });
    await job.updateProgress(50);
    await job.updateProgress(100);
    await this.redis.set(idempotencyKey, '1', 86400);

    return { reportId, status: 'generated' };
  }
}
