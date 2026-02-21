import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainNetwork } from '../entities/blockchain-network.entity';
import { BlockchainMonitoringService } from '../services/blockchain-monitoring.service';
import { CronJob } from 'cron';

@Injectable()
export class BlockchainMonitoringJob
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(BlockchainMonitoringJob.name);
  private readonly runningJobs = new Set<string>();

  constructor(
    @InjectRepository(BlockchainNetwork)
    private readonly networkRepository: Repository<BlockchainNetwork>,
    private readonly monitoringService: BlockchainMonitoringService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onApplicationBootstrap() {
    await this.initializeJobs();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping all blockchain monitoring jobs...');
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((job, name) => {
      if (name.startsWith('monitor_')) {
        job.stop();
        this.logger.log(`Stopped job: ${name}`);
      }
    });
  }

  async initializeJobs() {
    const networks = await this.networkRepository.find({
      where: { isActive: true },
    });
    for (const network of networks) {
      this.scheduleMonitoringJob(network);
    }
  }

  scheduleMonitoringJob(network: BlockchainNetwork) {
    const jobName = `monitor_${network.id}`;

    // Check if job already exists
    try {
      this.schedulerRegistry.getCronJob(jobName);
      this.logger.warn(`Job ${jobName} already scheduled.`);
      return;
    } catch (e) {
      // Job doesn't exist, proceed
    }

    const interval = network.monitoringInterval || 5000;
    const cronTime = `*/${interval / 1000} * * * * *`;

    const job = new CronJob(cronTime, async () => {
      if (this.runningJobs.has(network.id)) {
        this.logger.debug(
          `Job for network ${network.name} is already running, skipping overlapping execution.`,
        );
        return;
      }

      this.runningJobs.add(network.id);
      try {
        await this.monitoringService.monitorNetwork(network.id);
      } catch (error) {
        this.logger.error(`Error in scheduled job for ${network.name}:`, error);
      } finally {
        this.runningJobs.delete(network.id);
      }
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
    this.logger.log(
      `Scheduled monitoring job for ${network.name} every ${interval}ms`,
    );
  }

  async triggerManual(networkId: string) {
    if (this.runningJobs.has(networkId)) {
      throw new Error('Monitoring for this network is already in progress');
    }
    this.runningJobs.add(networkId);
    try {
      await this.monitoringService.monitorNetwork(networkId);
    } finally {
      this.runningJobs.delete(networkId);
    }
  }
}
