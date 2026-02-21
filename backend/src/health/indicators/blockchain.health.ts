import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { GlobalConfigService } from '../../config/global-config.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BlockchainHealthIndicator extends HealthIndicator {
  constructor(
    private readonly configService: GlobalConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const rpcEndpoint = this.configService.getBlockchainConfig().rpcEndpoint;

    if (!rpcEndpoint) {
      throw new HealthCheckError(
        'Blockchain RPC check failed',
        this.getStatus(key, false, { message: 'RPC Endpoint not configured' }),
      );
    }

    try {
      // Simple ping to the RPC endpoint
      // Assuming it supports standard JSON-RPC or at least responds to a HEAD/GET request
      // For EVM: { "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1 }
      const payload = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [] as any[],
        id: 1,
      };

      const response = await firstValueFrom(
        this.httpService.post<{ result: string }>(rpcEndpoint, payload, {
          timeout: 2000,
        }),
      );

      const isUp = response.status === 200 && !!response.data?.result;

      const result = this.getStatus(key, isUp, {
        blockNumber: response.data?.result,
        responseTime: response.statusText,
      });

      if (isUp) {
        return result;
      }

      throw new HealthCheckError('Blockchain RPC check failed', result);
    } catch (error) {
      const err = error as Error;
      throw new HealthCheckError(
        'Blockchain RPC check failed',
        this.getStatus(key, false, { message: err.message }),
      );
    }
  }
}
