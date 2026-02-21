import { registerAs } from '@nestjs/config';
import { BlockchainConfig } from './interfaces/config.interface';

export const blockchainConfig = registerAs(
  'blockchain',
  (): BlockchainConfig => ({
    rpcEndpoint: process.env.RPC_ENDPOINT || '',
    settlementPrivateKey: process.env.SETTLEMENT_PRIVATE_KEY || '',
    chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : undefined,
  }),
);
