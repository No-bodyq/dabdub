import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionMerchantDto {
    @ApiProperty() id: string;
    @ApiProperty() businessName: string;
    @ApiProperty() email: string;
}

export class TransactionOnChainDto {
    @ApiProperty() txHash: string;
    @ApiProperty() chain: string;
    @ApiPropertyOptional() blockNumber?: number;
    @ApiProperty() confirmations: number;
    @ApiPropertyOptional() tokenAddress?: string;
    @ApiPropertyOptional() tokenSymbol?: string;
    @ApiPropertyOptional() tokenAmount?: string;
    @ApiProperty() fromAddress: string;
    @ApiProperty() toAddress: string;
    @ApiPropertyOptional() gasUsed?: string;
    @ApiPropertyOptional() gasPriceGwei?: string;
    @ApiPropertyOptional() networkFeeEth?: string;
    @ApiPropertyOptional() networkFeeUsd?: string;
    @ApiPropertyOptional() explorerUrl?: string;
}

export class TransactionValuationDto {
    @ApiProperty() usdAmount: string;
    @ApiProperty() exchangeRate: string;
    @ApiPropertyOptional() valuedAt?: Date;
}

export class TransactionFeesDto {
    @ApiProperty() platformFeePercentage: string;
    @ApiProperty() platformFeeFlat: string;
    @ApiProperty() platformFeeUsd: string;
    @ApiProperty() networkFeeUsd: string;
    @ApiProperty() totalFeeUsd: string;
    @ApiProperty() merchantPayoutUsd: string;
}

export class TransactionSettlementDto {
    @ApiProperty() id: string;
    @ApiPropertyOptional() batchId?: string;
    @ApiProperty() fiatAmount: string;
    @ApiProperty() currency: string;
    @ApiProperty() exchangeRateUsed: string;
    @ApiPropertyOptional() settledAt?: Date;
    @ApiPropertyOptional() bankTransferReference?: string;
}

export class TransactionStatusHistoryItemDto {
    @ApiProperty() status: string;
    @ApiProperty() at: Date;
    @ApiPropertyOptional() reason?: string;
}

export class TransactionWebhookDto {
    @ApiProperty() id: string;
    @ApiProperty() event: string;
    @ApiPropertyOptional() deliveredAt?: Date;
    @ApiPropertyOptional() statusCode?: number;
    @ApiPropertyOptional() responseTimeMs?: number;
    @ApiProperty() attempts: number;
}

export class TransactionDetailResponseDto {
    @ApiProperty() id: string;
    @ApiProperty({ type: TransactionMerchantDto }) merchant: TransactionMerchantDto;
    @ApiProperty({ type: TransactionOnChainDto }) onChain: TransactionOnChainDto;
    @ApiProperty({ type: TransactionValuationDto }) valuation: TransactionValuationDto;
    @ApiProperty({ type: TransactionFeesDto }) fees: TransactionFeesDto;
    @ApiProperty() status: string;
    @ApiProperty({ type: [TransactionStatusHistoryItemDto] }) statusHistory: TransactionStatusHistoryItemDto[];
    @ApiPropertyOptional({ type: TransactionSettlementDto }) settlement?: TransactionSettlementDto;
    @ApiProperty({ type: [TransactionWebhookDto] }) webhooks: TransactionWebhookDto[];
    @ApiProperty({ type: [Object] }) adminActions: any[];
    @ApiPropertyOptional() metadata?: Record<string, any>;
    @ApiPropertyOptional() failureReason?: string;
    @ApiPropertyOptional() confirmedAt?: Date;
    @ApiPropertyOptional() settledAt?: Date;
    @ApiProperty() createdAt: Date;
}
