export interface SettlementJobPayload {
  settlementId: string;
  merchantId: string;
  transactionIds: string[];
  triggeredBy: 'AUTOMATIC' | 'MANUAL';
  triggeredByAdminId?: string;
  correlationId?: string;
}
