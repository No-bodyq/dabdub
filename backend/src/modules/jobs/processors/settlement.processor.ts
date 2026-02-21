import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { SettlementJobPayload } from '../payloads';
import { RedisService } from '../../../common/redis';

const QUEUE = 'settlements';
const IDEMPOTENCY_PREFIX = 'job:processed:settlements:';

@Processor(QUEUE)
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(job: Job<SettlementJobPayload, unknown, string>): Promise<unknown> {
    const { correlationId, settlementId } = job.data;
    const idempotencyKey = `${IDEMPOTENCY_PREFIX}${job.id}`;

    const alreadyProcessed = await this.redis.get(idempotencyKey);
    if (alreadyProcessed === '1') {
      this.logger.log(`Job ${job.id} already processed (idempotent skip)`, {
        correlationId,
        settlementId,
      });
      return { skipped: true, reason: 'idempotent' };
    }

    this.logger.log(`Processing settlement job ${job.id}`, {
      correlationId,
      settlementId,
    });
    await job.updateProgress(10);

    // Placeholder: actual settlement processing would go here
    await job.updateProgress(100);
    await this.redis.set(idempotencyKey, '1', 86400); // 24h

    return { settlementId, status: 'processed' };
  }
}
