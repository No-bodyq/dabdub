import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EVMService } from './evm.service';
import { WalletEntity, WalletType } from '../database/entities/wallet.entity';
import {
  EVMTransactionEntity,
  EVMTransactionStatus,
} from '../database/entities/evm-transaction.entity';
import {
  SUPPORTED_CHAINS,
  USDC_CONTRACT_ADDRESSES,
  CHAIN_IDS,
  ERC20_ABI,
} from './evm.constants';
import { parseAbiItem } from 'viem';

@Injectable()
export class EVMBlockMonitorService {
  private readonly logger = new Logger(EVMBlockMonitorService.name);
  private readonly lastProcessedBlock: Map<number, bigint> = new Map();
  private isProcessing = false;

  constructor(
    private readonly evmService: EVMService,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(EVMTransactionEntity)
    private readonly txRepo: Repository<EVMTransactionEntity>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async monitorBlocks() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    try {
      for (const chainId of Object.values(CHAIN_IDS)) {
        await this.processChain(chainId);
      }
    } catch (error: any) {
      this.logger.error(
        `Error in block monitoring: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private async processChain(chainId: number) {
    try {
      const client = this.evmService.getPublicClient(chainId);
      const currentBlock = await client.getBlockNumber();

      // Initialize last processed block if missing
      if (!this.lastProcessedBlock.has(chainId)) {
        this.lastProcessedBlock.set(chainId, currentBlock - 1n); // Start from previous block
        return;
      }

      const lastBlock = this.lastProcessedBlock.get(chainId)!;

      // Process max 10 blocks at a time to avoid RPC limits
      const processUpTo =
        lastBlock + 10n > currentBlock ? currentBlock : lastBlock + 10n;

      if (processUpTo <= lastBlock) {
        return;
      }

      this.logger.debug(
        `Processing blocks ${lastBlock + 1n} to ${processUpTo} on chain ${chainId}`,
      );

      const usdcAddress = USDC_CONTRACT_ADDRESSES[chainId];
      if (!usdcAddress) return;

      // Get all deposit wallets for this chain
      // Helper needed or just fetch all and filter in memory if list is small?
      // Better to cache wallet addresses or fetch only relevant ones if possible.
      // For now, let's fetch logs first, then check if 'to' is in our DB.
      const wallets = await this.walletRepo.find({
        where: {
          chain: chainId.toString(), // Entity stores chain as string? Need to verify mapping
          type: WalletType.DEPOSIT,
        },
      });
      const monitoredAddresses = new Set(
        wallets.map((w) => w.address.toLowerCase()),
      );

      const logs = await client.getContractEvents({
        address: usdcAddress,
        abi: ERC20_ABI,
        eventName: 'Transfer',
        fromBlock: lastBlock + 1n,
        toBlock: processUpTo,
        strict: true, // Ensure logs are strictly typed according to ABI
      });

      for (const log of logs) {
        // With strict: true, args should be defined. If not, we safeguard.
        if (!('args' in log)) continue;
        const { from, to, value } = (log as any).args;

        if (to && monitoredAddresses.has(to.toLowerCase())) {
          await this.handleDeposit(chainId, log, from!, to, value!);
        }
      }

      this.lastProcessedBlock.set(chainId, processUpTo);
    } catch (error: any) {
      this.logger.error(`Error processing chain ${chainId}: ${error.message}`);
    }
  }

  private async handleDeposit(
    chainId: number,
    log: any,
    from: string,
    to: string,
    value: bigint,
  ) {
    const txHash = log.transactionHash;

    // Idempotency check
    const existing = await this.txRepo.findOne({ where: { txHash } });
    if (existing) return;

    this.logger.log(
      `Detected deposit of ${value} units to ${to} on chain ${chainId}`,
    );

    const tx = this.txRepo.create({
      txHash,
      fromAddress: from,
      toAddress: to,
      amount: value.toString(),
      currency: 'USDC',
      chain: chainId.toString(),
      status: EVMTransactionStatus.CONFIRMED, // Assume confirmed if found in block deep enough? Or just logged.
      blockNumber: Number(log.blockNumber),
      confirmations: 1, // Start with 1
    });

    await this.txRepo.save(tx);
  }
}
