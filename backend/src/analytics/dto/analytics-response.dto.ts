import { ApiProperty } from '@nestjs/swagger';

export class MetricDto {
  @ApiProperty({ description: 'Metric value' })
  value: number;

  @ApiProperty({
    description: 'Percentage change from previous period',
    required: false,
  })
  change?: number;

  @ApiProperty({ description: 'Currency code', required: false })
  currency?: string;
}

export class DashboardMetricsDto {
  @ApiProperty({ description: 'Total revenue metrics' })
  totalRevenue: MetricDto;

  @ApiProperty({ description: 'Total transaction count' })
  totalTransactions: MetricDto;

  @ApiProperty({ description: 'Average transaction value' })
  averageTransactionValue: MetricDto;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: MetricDto;

  @ApiProperty({ description: 'Total settlements completed' })
  totalSettlements: MetricDto;

  @ApiProperty({ description: 'Pending settlements count' })
  pendingSettlements: MetricDto;

  @ApiProperty({ description: 'Total fees collected' })
  totalFees: MetricDto;

  @ApiProperty({ description: 'Active customers count' })
  activeCustomers: MetricDto;
}

export class RevenueDataPointDto {
  @ApiProperty({ description: 'Date or period label' })
  date: string;

  @ApiProperty({ description: 'Revenue amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Transaction count for this period' })
  count: number;
}

export class RevenueResponseDto {
  @ApiProperty({
    description: 'Revenue data points',
    type: [RevenueDataPointDto],
  })
  data: RevenueDataPointDto[];

  @ApiProperty({ description: 'Total revenue across all periods' })
  total: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Growth percentage compared to previous period' })
  growth: number;
}

export class TransactionTrendDto {
  @ApiProperty({ description: 'Period timestamp' })
  period: string;

  @ApiProperty({ description: 'Transaction count' })
  count: number;

  @ApiProperty({ description: 'Total volume' })
  volume: number;

  @ApiProperty({ description: 'Success count' })
  successCount: number;

  @ApiProperty({ description: 'Failed count' })
  failedCount: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;
}

export class TransactionTrendsResponseDto {
  @ApiProperty({
    description: 'Trend data points',
    type: [TransactionTrendDto],
  })
  trends: TransactionTrendDto[];

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalCount: number;
    totalVolume: number;
    averageSuccessRate: number;
  };
}

export class SettlementStatisticsDto {
  @ApiProperty({ description: 'Total settlements' })
  total: number;

  @ApiProperty({ description: 'Completed settlements' })
  completed: number;

  @ApiProperty({ description: 'Pending settlements' })
  pending: number;

  @ApiProperty({ description: 'Failed settlements' })
  failed: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Average settlement time in hours' })
  averageSettlementTime: number;

  @ApiProperty({ description: 'Total settlement amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

export class NetworkUsageDto {
  @ApiProperty({ description: 'Network name' })
  network: string;

  @ApiProperty({ description: 'Transaction count' })
  transactionCount: number;

  @ApiProperty({ description: 'Total volume' })
  volume: number;

  @ApiProperty({ description: 'Percentage of total transactions' })
  percentage: number;

  @ApiProperty({ description: 'Average transaction value' })
  averageValue: number;

  @ApiProperty({ description: 'Success rate' })
  successRate: number;
}

export class NetworkUsageResponseDto {
  @ApiProperty({ description: 'Network usage data', type: [NetworkUsageDto] })
  networks: NetworkUsageDto[];

  @ApiProperty({ description: 'Most popular network' })
  mostPopular: string;
}

export class PerformanceMetricsDto {
  @ApiProperty({ description: 'Overall success rate' })
  overallSuccessRate: number;

  @ApiProperty({ description: 'Payment success rate' })
  paymentSuccessRate: number;

  @ApiProperty({ description: 'Settlement success rate' })
  settlementSuccessRate: number;

  @ApiProperty({ description: 'Average processing time in seconds' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Average settlement time in hours' })
  averageSettlementTime: number;

  @ApiProperty({ description: 'Failed transactions count' })
  failedTransactions: number;

  @ApiProperty({ description: 'Retry success rate' })
  retrySuccessRate: number;
}

export class CustomerInsightDto {
  @ApiProperty({ description: 'Total unique customers' })
  totalCustomers: number;

  @ApiProperty({ description: 'New customers in period' })
  newCustomers: number;

  @ApiProperty({ description: 'Returning customers' })
  returningCustomers: number;

  @ApiProperty({ description: 'Average transaction per customer' })
  averageTransactionsPerCustomer: number;

  @ApiProperty({ description: 'Average customer value' })
  averageCustomerValue: number;

  @ApiProperty({ description: 'Top customers by volume', type: [Object] })
  topCustomers: Array<{
    email: string;
    transactionCount: number;
    totalVolume: number;
  }>;
}

export class ReportGenerateDto {
  @ApiProperty({ description: 'Report ID' })
  reportId: string;

  @ApiProperty({ description: 'Report status' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'Report type' })
  type: string;

  @ApiProperty({ description: 'Estimated completion time' })
  estimatedCompletion: string;
}

export class ChartDataDto {
  @ApiProperty({ description: 'Chart labels' })
  labels: string[];

  @ApiProperty({ description: 'Chart datasets' })
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}
