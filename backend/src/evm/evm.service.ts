import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  PublicClient,
  WalletClient,
  parseUnits,
  formatUnits,
  Hex,
  defineChain,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import {
  SUPPORTED_CHAINS,
  DEFAULT_RPC_URLS,
  USDC_CONTRACT_ADDRESSES,
  ERC20_ABI,
  CHAIN_IDS,
} from './evm.constants';

@Injectable()
export class EVMService implements OnModuleInit {
  private readonly logger = new Logger(EVMService.name);
  private publicClients: Map<number, PublicClient> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeClients();
  }

  private initializeClients() {
    for (const [key, chain] of Object.entries(SUPPORTED_CHAINS)) {
      const chainId = chain.id;
      const rpcUrls = DEFAULT_RPC_URLS[chainId] || [];

      if (rpcUrls.length === 0) {
        this.logger.warn(
          `No RPC URLs configured for chain ${chain.name} (${chainId})`,
        );
        continue;
      }

      const transports = rpcUrls.map((url) => http(url));

      const client = createPublicClient({
        chain,
        transport: fallback(transports),
      }) as PublicClient;

      this.publicClients.set(chainId, client);
      this.logger.log(`Initialized public client for ${chain.name}`);
    }
  }

  public getPublicClient(chainId: number): PublicClient {
    const client = this.publicClients.get(chainId);
    if (!client) {
      throw new Error(`No public client initialized for chain ID ${chainId}`);
    }
    return client;
  }

  async createWallet(): Promise<{ address: string; privateKey: string }> {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return {
      address: account.address,
      privateKey: privateKey,
    };
  }

  async getNativeBalance(chainId: number, address: string): Promise<string> {
    const client = this.getPublicClient(chainId);
    const balance = await client.getBalance({ address: address as Hex });
    return balance.toString();
  }

  async getUSDCBalance(chainId: number, address: string): Promise<string> {
    const client = this.getPublicClient(chainId);
    const usdcAddress = USDC_CONTRACT_ADDRESSES[chainId];

    if (!usdcAddress) {
      throw new Error(`USDC not supported or configured on chain ${chainId}`);
    }

    const balance = (await client.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as Hex],
    })) as bigint;

    return balance.toString();
  }

  // This method assumes the caller manages the sensitive private key and passes it in.
  // In a real scenario, we might use a secure vault or HSM.
  async sendUSDCTransaction(
    chainId: number,
    privateKey: string,
    to: string,
    amount: string, // Amount in smallest unit (e.g. 6 decimals for USDC usually)
  ): Promise<string> {
    const client = this.getPublicClient(chainId);
    const account = privateKeyToAccount(privateKey as Hex);

    // We need a wallet client to sign and send
    // Since wallet clients are usually lightweight and depend on the account, we can create one on the fly
    // or cache them if needed. Creating on fly for simplicity and statelessness regarding accounts.
    const walletClient = createWalletClient({
      account,
      chain:
        SUPPORTED_CHAINS[
          this.getChainNameFromId(chainId) as keyof typeof SUPPORTED_CHAINS
        ],
      transport: http(DEFAULT_RPC_URLS[chainId][0]), // Use primary RPC for sending
    });

    const usdcAddress = USDC_CONTRACT_ADDRESSES[chainId];
    if (!usdcAddress) {
      throw new Error(`USDC not supported or configured on chain ${chainId}`);
    }

    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to as Hex, BigInt(amount)],
      account,
    });

    return hash;
  }

  async getTransactionReceipt(chainId: number, hash: string) {
    const client = this.getPublicClient(chainId);
    return await client.getTransactionReceipt({ hash: hash as Hex });
  }

  async getBlockNumber(chainId: number): Promise<bigint> {
    const client = this.getPublicClient(chainId);
    return await client.getBlockNumber();
  }

  // Explicitly getting chain name from ID for type safety with SUPPORTED_CHAINS keys if needed
  // But since SUPPORTED_CHAINS values are Chain objects, we can just find it.
  private getChainNameFromId(chainId: number): string {
    const entry = Object.entries(CHAIN_IDS).find(([k, v]) => v === chainId);
    if (!entry) throw new Error(`Unknown chain ID ${chainId}`);
    return entry[0];
  }
}
