import { ApiProperty } from '@nestjs/swagger';

export class MerchantOverviewDto {
  @ApiProperty({ description: 'Total revenue in USDC for the last 30 days' })
  totalRevenueUsdc30d!: string;

  @ApiProperty({ description: 'Total revenue in NGN for the last 30 days (at settled rates)' })
  totalRevenueNgn30d!: string;

  @ApiProperty({ description: 'Number of transactions in the last 30 days' })
  transactionCount30d!: number;

  @ApiProperty({ description: 'Number of unique customers in the last 30 days' })
  uniqueCustomers30d!: number;

  @ApiProperty({ description: 'Average transaction amount in USDC' })
  avgTransactionUsdc!: string;

  @ApiProperty({ description: 'Pending settlement amount in USDC' })
  pendingSettlementUsdc!: string;

  @ApiProperty({ description: 'Timestamp of last settlement', nullable: true })
  lastSettledAt!: Date | null;

  @ApiProperty({ 
    description: 'Top payment method used',
    enum: ['username_send', 'paylink', 'virtual_account']
  })
  topPaymentMethod!: string;
}

export class TopRecipientDto {
  @ApiProperty({ description: 'Recipient username' })
  username!: string;

  @ApiProperty({ description: 'Total amount sent to this recipient' })
  totalSent!: string;
}

export class RevenueDataPointDto {
  @ApiProperty({ description: 'Timestamp for this data point' })
  timestamp!: Date;

  @ApiProperty({ description: 'Revenue amount in USDC' })
  revenueUsdc!: string;

  @ApiProperty({ description: 'Number of transactions in this period' })
  transactionCount!: number;
}

export class RevenueTimelineDto {
  @ApiProperty({ description: 'Granularity of the timeline' })
  granularity!: 'hour' | 'day' | 'week' | 'month';

  @ApiProperty({ description: 'Revenue data points' })
  data!: RevenueDataPointDto[];
}

export enum RevenueGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}
