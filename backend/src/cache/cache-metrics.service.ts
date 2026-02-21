import { Injectable, Logger } from '@nestjs/common';

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

@Injectable()
export class CacheMetricsService {
  private readonly logger = new Logger(CacheMetricsService.name);
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
  };

  /**
   * Record a cache hit
   */
  recordHit(): void {
    this.metrics.hits++;
    this.updateHitRate();
  }

  /**
   * Record a cache miss
   */
  recordMiss(): void {
    this.metrics.misses++;
    this.updateHitRate();
  }

  /**
   * Record a cache set operation
   */
  recordSet(): void {
    this.metrics.sets++;
  }

  /**
   * Record a cache delete operation
   */
  recordDelete(): void {
    this.metrics.deletes++;
  }

  /**
   * Record a cache error
   */
  recordError(): void {
    this.metrics.errors++;
  }

  /**
   * Get current metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
    };
  }

  /**
   * Log metrics summary
   */
  logSummary(): void {
    const { hits, misses, sets, deletes, errors, hitRate } = this.metrics;
    this.logger.log(
      `Cache Metrics - Hits: ${hits}, Misses: ${misses}, Sets: ${sets}, Deletes: ${deletes}, Errors: ${errors}, Hit Rate: ${(hitRate * 100).toFixed(2)}%`,
    );
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }
}
