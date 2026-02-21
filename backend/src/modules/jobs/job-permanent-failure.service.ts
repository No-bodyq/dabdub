import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { QUEUE_NAMES } from './jobs.service';
import { GlobalConfigService } from '../../config/global-config.service';

/**
 * Listens to queue 'failed' events. When a job has exhausted all retries
 * (attemptsMade >= attempts), emits job.permanently.failed (log + system alert).
 */
@Injectable()
export class JobPermanentFailureService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobPermanentFailureService.name);
  private readonly queueEvents: QueueEvents[] = [];

  constructor(
    private readonly config: GlobalConfigService,
    @InjectQueue('settlements') private settlementsQueue: Queue,
    @InjectQueue('exports') private exportsQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('refunds') private refundsQueue: Queue,
    @InjectQueue('compliance-reports') private complianceReportsQueue: Queue,
    @InjectQueue('webhooks') private webhooksQueue: Queue,
  ) {}

  private getQueues(): Queue[] {
    return [
      this.settlementsQueue,
      this.exportsQueue,
      this.notificationsQueue,
      this.refundsQueue,
      this.complianceReportsQueue,
      this.webhooksQueue,
    ];
  }

  async onModuleInit(): Promise<void> {
    const redis = this.config.getRedisConfig();
    const connection = {
      host: redis.host,
      port: redis.port,
      password: redis.password ?? undefined,
      db: redis.db ?? 0,
    };
    const queues = this.getQueues();
    for (let i = 0; i < queues.length; i++) {
      const queue = queues[i];
      const queueName = QUEUE_NAMES[i];
      const events = new QueueEvents(queueName, { connection });
      events.on('failed', async ({ jobId }) => {
        try {
          const job = await queue.getJob(jobId);
          if (!job) return;
          const attempts = job.opts.attempts ?? 1;
          if (job.attemptsMade >= attempts) {
            this.handlePermanentFailure(queueName, job);
          }
        } catch (err) {
          this.logger.warn(`Failed to handle failed job ${jobId}`, err);
        }
      });
      this.queueEvents.push(events);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.queueEvents.map((e) => e.close()));
  }

  private handlePermanentFailure(queueName: string, job: any): void {
    this.logger.error(
      `job.permanently.failed queue=${queueName} jobId=${job.id} attemptsMade=${job.attemptsMade} reason=${job.failedReason}`,
    );
    // Emit event for system alert: could use EventEmitter2 or push to alerts module
    // this.eventEmitter.emit('job.permanently.failed', { queueName, job });
  }
}
