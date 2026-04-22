import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Inject } from '@nestjs/common';
import { stellarConfig } from '../config';
import type { StellarConfig } from '../config';
import { AdminAlertService } from '../alerts/admin-alert.service';
import { AdminAlertType } from '../alerts/admin-alert.entity';

/** Milliseconds before the Stellar RPC call is considered timed out. */
const STELLAR_TIMEOUT_MS = 5_000;

/**
 * StellarHealthIndicator calls GET /fee_stats on the configured Stellar RPC URL.
 *
 * /fee_stats is a lightweight, unauthenticated endpoint available on both
 * Horizon (mainnet/testnet) and Soroban RPC-compatible nodes.
 * A 200 response confirms the node is reachable and serving requests.
 *
 * Uses the Node 18+ built-in `fetch` — no @nestjs/axios dependency required.
 */
@Injectable()
export class StellarHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(StellarHealthIndicator.name);
  private readonly feeStatsUrl: string;
  private failureCount = 0;

  constructor(
    @Inject(stellarConfig.KEY)
    private readonly cfg: StellarConfig,
    private readonly adminAlertService: AdminAlertService,
  ) {
    super();
    // Normalise: strip trailing slash so the path join is always clean.
    const base = cfg.rpcUrl.replace(/\/+$/, '');
    this.feeStatsUrl = `${base}/fee_stats`;
  }

  /**
   * Perform a GET /fee_stats check.
   * Any HTTP 2xx response is treated as healthy.
   * Network errors and non-2xx responses surface as HealthCheckError.
   */
  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STELLAR_TIMEOUT_MS);

    try {
      const response = await fetch(this.feeStatsUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} from ${this.feeStatsUrl}`,
        );
      }

      this.failureCount = 0;
      return this.getStatus(key, true);
    } catch (err) {
      this.failureCount += 1;
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? `Timed out after ${STELLAR_TIMEOUT_MS} ms`
            : err.message
          : String(err);

      this.logger.warn(`Stellar health check failed: ${message}`);
      await this.adminAlertService.raise({
        type: AdminAlertType.STELLAR_HEALTH,
        dedupeKey: key,
        message: `Stellar health check failed: ${message}`,
        metadata: {
          rpcUrl: this.cfg.rpcUrl,
        },
        thresholdValue: this.failureCount,
      });

      const result = this.getStatus(key, false, { message });
      throw new HealthCheckError(`${key} is down`, result);
    } finally {
      clearTimeout(timer);
    }
  }
}
