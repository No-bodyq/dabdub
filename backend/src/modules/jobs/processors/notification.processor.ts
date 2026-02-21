import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { NotificationJobPayload } from '../payloads';
import { RedisService } from '../../../common/redis';

const QUEUE = 'notifications';
const IDEMPOTENCY_PREFIX = 'job:processed:notifications:';

@Processor(QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(job: Job<NotificationJobPayload, unknown, string>): Promise<unknown> {
    const { correlationId, notificationId } = job.data;
    const idempotencyKey = `${IDEMPOTENCY_PREFIX}${job.id}`;

    const alreadyProcessed = await this.redis.get(idempotencyKey);
    if (alreadyProcessed === '1') {
      this.logger.log(`Notification job ${job.id} already processed (idempotent skip)`, {
        correlationId,
        notificationId,
      });
      return { skipped: true, reason: 'idempotent' };
    }

    this.logger.log(`Processing notification job ${job.id}`, {
      correlationId,
      notificationId,
    });
    await job.updateProgress(50);

    // Placeholder: actual send would go here
    await job.updateProgress(100);
    await this.redis.set(idempotencyKey, '1', 86400);

    return { notificationId, status: 'sent' };
  }
}
