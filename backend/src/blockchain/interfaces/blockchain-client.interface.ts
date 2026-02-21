export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  memo?: string;
  timestamp: Date;
  blockNumber: string;
}

export interface BlockchainBlock {
  number: string;
  hash: string;
  timestamp: Date;
  transactions: BlockchainTransaction[];
}

export interface IBlockchainClient {
  getLatestBlockNumber(): Promise<bigint>;
  getBlock(blockNumber: bigint): Promise<BlockchainBlock>;
}
