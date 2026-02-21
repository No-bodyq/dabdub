export interface StandardTransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  from: string;
  to: string;
  status: 'success' | 'reverted';
  gasUsed: string;
  effectiveGasPrice: string;
  logs: any[];
}
