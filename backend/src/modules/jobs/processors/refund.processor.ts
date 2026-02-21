import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { RefundJobPayload } from '../payloads';
import { RedisService } from '../../../common/redis';

const QUEUE = 'refunds';
const IDEMPOTENCY_PREFIX = 'job:processed:refunds:';

@Processor(QUEUE)
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(job: Job<RefundJobPayload, unknown, string>): Promise<unknown> {
    const { correlationId, refundId } = job.data;
    const idempotencyKey = IDEMPOTENCY_PREFIX + job.id;

    const alreadyProcessed = await this.redis.get(idempotencyKey);
    if (alreadyProcessed === '1') {
      this.logger.log(`Refund job ${job.id} already processed (idempotent skip)`, {
        correlationId,
        refundId,
      });
      return { skipped: true, reason: 'idempotent' };
    }

    this.logger.log(`Processing refund job ${job.id}`, { correlationId, refundId });
    await job.updateProgress(50);
    await job.updateProgress(100);
    await this.redis.set(idempotencyKey, '1', 86400);

    return { refundId, status: 'refunded' };
  }
}
