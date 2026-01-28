import { Injectable, Logger } from '@nestjs/common';
import { GlobalConfigService } from '../../config/global-config.service';

/**
 * Stub service for on-chain Stellar smart contract interactions.
 * Implement actual SDK calls when @stellar/stellar-sdk is integrated.
 */
@Injectable()
export class StellarContractService {
  private readonly logger = new Logger(StellarContractService.name);

  constructor(private readonly configService: GlobalConfigService) {}

  async createOnChainRequest(params: {
    requestId: string;
    merchantAddress: string;
    amount: number;
    reference: string;
    expiresAt: number;
    network?: string;
  }): Promise<{ txHash: string; onChainPaymentId: string } | null> {
    this.logger.warn(
      'StellarContractService.createOnChainRequest is a stub. On-chain interaction not yet implemented.',
    );
    return null;
  }

  async markPaidOnChain(params: {
    requestId: string;
    paymentId: string;
    network?: string;
  }): Promise<{ txHash: string } | null> {
    this.logger.warn(
      'StellarContractService.markPaidOnChain is a stub. On-chain interaction not yet implemented.',
    );
    return null;
  }

  async cancelOnChain(params: {
    requestId: string;
    network?: string;
  }): Promise<{ txHash: string } | null> {
    this.logger.warn(
      'StellarContractService.cancelOnChain is a stub. On-chain interaction not yet implemented.',
    );
    return null;
  }

  getWalletAddress(network?: string): string {
    const stellarConfig = this.configService.getStellarConfig();
    const activeNetwork = network || stellarConfig.activeNetwork;
    const networkConfig = stellarConfig.networks[activeNetwork];

    if (!networkConfig) {
      this.logger.warn(
        `No network config found for ${activeNetwork}, returning placeholder address.`,
      );
      return 'GPLACEHOLDERADDRESS';
    }

    // In a real implementation, derive the public key from backendSecretKey
    return 'GPLACEHOLDERADDRESS';
  }
}
