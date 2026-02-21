import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { WebhookJobPayload } from '../payloads';
import { RedisService } from '../../../common/redis';

const QUEUE = 'webhooks';
const IDEMPOTENCY_PREFIX = 'job:processed:webhooks:';

@Processor(QUEUE)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(job: Job<WebhookJobPayload, unknown, string>): Promise<unknown> {
    const { correlationId, deliveryId } = job.data;
    const idempotencyKey = `${IDEMPOTENCY_PREFIX}${job.id}`;

    const alreadyProcessed = await this.redis.get(idempotencyKey);
    if (alreadyProcessed === '1') {
      this.logger.log(`Webhook job ${job.id} already processed (idempotent skip)`, {
        correlationId,
        deliveryId,
      });
      return { skipped: true, reason: 'idempotent' };
    }

    this.logger.log(`Processing webhook job ${job.id}`, {
      correlationId,
      deliveryId,
    });
    await job.updateProgress(50);
    await job.updateProgress(100);
    await this.redis.set(idempotencyKey, '1', 86400);

    return { deliveryId, status: 'delivered' };
  }
}
