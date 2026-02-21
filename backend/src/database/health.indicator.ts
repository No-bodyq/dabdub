import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator {
  private readonly logger = new Logger('DatabaseHealth');

  constructor(private dataSource: DataSource) {
    this.logPoolMetrics();
  }

  private logPoolMetrics() {
    if (this.dataSource.isInitialized) {
      const pool = (this.dataSource.driver as any).pool;
      if (pool) {
        this.logger.log(`Connection pool initialized - Size: ${pool._max}`);
      }
    }
  }

  async checkHealth() {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      const pool = (this.dataSource.driver as any).pool;
      const poolMetrics = pool
        ? {
            poolSize: pool._max,
            availableConnections: pool._available?.size || 0,
            waitingQueue: pool._waitingQueue?.length || 0,
          }
        : null;

      const health = {
        status: 'ok',
        database: 'postgres',
        responseTime: `${responseTime}ms`,
        connected: this.dataSource.isInitialized,
        ...(poolMetrics && { poolMetrics }),
      };

      // Log pool metrics on health check
      if (poolMetrics) {
        this.logger.debug(
          `Pool Status - Available: ${poolMetrics.availableConnections}/${poolMetrics.poolSize}, Waiting: ${poolMetrics.waitingQueue}`,
        );
      }

      return health;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'error',
        database: 'postgres',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
