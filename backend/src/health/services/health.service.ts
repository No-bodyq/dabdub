import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { BlockchainHealthIndicator } from '../indicators/blockchain.health';
import { RedisHealthIndicator } from '../../common/redis';
import { GlobalConfigService } from '../../config/global-config.service';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private blockchain: BlockchainHealthIndicator,
    private redisIndicator: RedisHealthIndicator,
    private configService: GlobalConfigService,
  ) {}

  async check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  async checkReadiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redisIndicator.isHealthy('redis'),
    ]);
  }

  async checkLiveness() {
    return this.health.check([]);
  }

  async checkDetailed() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      () => this.blockchain.isHealthy('blockchain_rpc'),
      () => this.redisIndicator.isHealthy('redis'),
      // Example external API check if URL exists
      // () => this.http.pingCheck('partner_api', 'https://partner-api.com'),
    ]);
  }
}
