import {
  IsUUID,
  IsOptional,
  IsArray,
  IsString,
  MinLength,
} from "class-validator";

export class TriggerSettlementDto {
  @IsUUID()
  merchantId: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  transactionIds?: string[];

  @IsString()
  @MinLength(10)
  reason: string;
}

export class PutSettlementOnHoldDto {
  @IsString()
  @MinLength(20)
  reason: string;
}

export class SettlementResponseDto {
  id: string;
  merchantId: string;
  transactionIds: string[];
  grossAmountUsd: string;
  totalFeesUsd: string;
  netAmountFiat: string;
  settlementCurrency: string;
  exchangeRateUsed: string;
  status: string;
  bankTransferReference: string | null;
  liquidityProviderRef: string | null;
  failureReason: string | null;
  processingStartedAt: Date | null;
  completedAt: Date | null;
  transactionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SettlementListResponseDto {
  data: SettlementResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class PendingMerchantSettlement {
  merchant: {
    id: string;
    businessName: string;
  };
  pendingTransactionCount: number;
  pendingVolumeUsd: string;
  oldestPendingAt: Date;
  settlementConfig: {
    currency: string;
    frequency: string;
  };
}

export class SettlementPendingDashboardDto {
  pendingByMerchant: PendingMerchantSettlement[];
  totals: {
    merchantCount: number;
    transactionCount: number;
    volumeUsd: string;
  };
}
