import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Settlement,
  SettlementStatus,
} from '../settlement/entities/settlement.entity';
import { Merchant } from '../database/entities/merchant.entity';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from '../database/entities/payment-request.entity';
import {
  DashboardMetricsDto,
  RevenueResponseDto,
  TransactionTrendsResponseDto,
  SettlementStatisticsDto,
  NetworkUsageResponseDto,
  PerformanceMetricsDto,
  CustomerInsightDto,
  TransactionTrendDto,
  NetworkUsageDto,
} from './dto/analytics-response.dto';
import { TimeInterval } from './dto/date-range.dto';

@Injectable()
export class AnalyticsService {
  private readonly CACHE_TTL = 600; // 10 minutes in seconds

  constructor(
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(PaymentRequest)
    private paymentRequestRepository: Repository<PaymentRequest>,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

  async getPaymentVolume(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const cacheKey = `volume:${merchantId}:${startDate.getTime()}:${endDate.getTime()}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const rawData = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select('SUM(pr.amount)', 'totalVolume')
      .addSelect('pr.currency', 'currency')
      .where('pr.merchant_id = :merchantId', { merchantId })
      .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('pr.status = :status', {
        status: PaymentRequestStatus.COMPLETED,
      })
      .groupBy('pr.currency')
      .getRawMany();

    const result = rawData.map((d) => ({
      currency: d.currency,
      totalVolume: parseFloat(d.totalVolume) || 0,
    }));
    await this.cacheManager.set(cacheKey, result, 600000); // 10 minutes cache
    return result;
  }

  async getSettlementSuccessRate(merchantId: string): Promise<any> {
    const totalSettlements = await this.settlementRepository.count({
      where: { merchantId },
    });

    const successfulSettlements = await this.settlementRepository.count({
      where: { merchantId, status: SettlementStatus.COMPLETED },
    });

    return {
      total: totalSettlements,
      successful: successfulSettlements,
      rate:
        totalSettlements > 0
          ? (successfulSettlements / totalSettlements) * 100
          : 0,
    };
  }

  async getMerchantRevenue(merchantId: string): Promise<any> {
    const rawData = await this.settlementRepository
      .createQueryBuilder('s')
      .select('SUM(s.net_amount)', 'totalRevenue')
      .addSelect('s.currency', 'currency')
      .where('s.merchant_id = :merchantId', { merchantId })
      .andWhere('s.status = :status', { status: SettlementStatus.COMPLETED })
      .groupBy('s.currency')
      .getRawMany();

    return rawData.map((d) => ({
      currency: d.currency,
      totalRevenue: parseFloat(d.totalRevenue) || 0,
    }));
  }

  async getTransactionTrends(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month',
  ): Promise<any> {
    let truncDate = 'day';
    if (interval === 'week') truncDate = 'week';
    if (interval === 'month') truncDate = 'month';

    const rawData = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select(`DATE_TRUNC('${truncDate}', pr.created_at) as period`)
      .addSelect('SUM(pr.amount)', 'volume')
      .addSelect('COUNT(pr.id)', 'count')
      .addSelect('pr.currency', 'currency')
      .where('pr.merchant_id = :merchantId', { merchantId })
      .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('pr.status = :status', {
        status: PaymentRequestStatus.COMPLETED,
      })
      .groupBy('period')
      .addGroupBy('pr.currency')
      .orderBy('period', 'ASC')
      .getRawMany();

    return rawData.map((d) => ({
      period: d.period,
      volume: parseFloat(d.volume) || 0,
      count: parseInt(d.count, 10) || 0,
      currency: d.currency,
    }));
  }

  async getFeeAnalysis(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const rawData = await this.settlementRepository
      .createQueryBuilder('s')
      .select('SUM(s.fee_amount)', 'totalFees')
      .addSelect('AVG(s.fee_percentage)', 'averageFeePercentage')
      .addSelect('s.currency', 'currency')
      .where('s.merchant_id = :merchantId', { merchantId })
      .andWhere('s.processed_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('s.currency')
      .getRawMany();

    return rawData.map((d) => ({
      currency: d.currency,
      totalFees: parseFloat(d.totalFees) || 0,
      averageFeePercentage: parseFloat(d.averageFeePercentage) || 0,
    }));
  }

  async getMerchantGrowth(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Growth in terms of volume compared to previous period?
    // Or simple transaction count growth?
    // Let's implement transaction count growth for now
    const currentPeriod = await this.paymentRequestRepository.count({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate),
        status: PaymentRequestStatus.COMPLETED,
      },
    });

    // Calculate previous period
    const duration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - duration);
    const prevEndDate = startDate;

    const previousPeriod = await this.paymentRequestRepository.count({
      where: {
        merchantId,
        createdAt: Between(prevStartDate, prevEndDate),
        status: PaymentRequestStatus.COMPLETED,
      },
    });

    const growth =
      previousPeriod > 0
        ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
        : 0;
    return {
      currentPeriodCount: currentPeriod,
      previousPeriodCount: previousPeriod,
      growthPercentage: growth,
    };
  }

  async getDashboardMetrics(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DashboardMetricsDto> {
    const cacheKey = `dashboard:${merchantId}:${startDate.getTime()}:${endDate.getTime()}`;
    const cached = await this.cacheManager.get<DashboardMetricsDto>(cacheKey);
    if (cached) return cached;

    // Calculate previous period for comparison
    const duration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - duration);
    const prevEndDate = startDate;

    // Parallel queries for better performance
    const [
      currentRevenue,
      prevRevenue,
      currentTransactions,
      prevTransactions,
      settlementStats,
      currentSettlements,
      prevSettlements,
      feeData,
      customerData,
    ] = await Promise.all([
      this.getTotalRevenue(merchantId, startDate, endDate),
      this.getTotalRevenue(merchantId, prevStartDate, prevEndDate),
      this.getTransactionCount(merchantId, startDate, endDate),
      this.getTransactionCount(merchantId, prevStartDate, prevEndDate),
      this.getSettlementSuccessRate(merchantId),
      this.getSettlementCount(merchantId, startDate, endDate),
      this.getSettlementCount(merchantId, prevStartDate, prevEndDate),
      this.getTotalFees(merchantId, startDate, endDate),
      this.getActiveCustomers(merchantId, startDate, endDate),
    ]);

    const avgTransactionValue =
      currentTransactions.total > 0
        ? currentRevenue.total / currentTransactions.total
        : 0;

    const prevAvgTransactionValue =
      prevTransactions.total > 0
        ? prevRevenue.total / prevTransactions.total
        : 0;

    const metrics: DashboardMetricsDto = {
      totalRevenue: {
        value: currentRevenue.total,
        change: this.calculatePercentageChange(
          currentRevenue.total,
          prevRevenue.total,
        ),
        currency: 'USD',
      },
      totalTransactions: {
        value: currentTransactions.total,
        change: this.calculatePercentageChange(
          currentTransactions.total,
          prevTransactions.total,
        ),
      },
      averageTransactionValue: {
        value: avgTransactionValue,
        change: this.calculatePercentageChange(
          avgTransactionValue,
          prevAvgTransactionValue,
        ),
        currency: 'USD',
      },
      successRate: {
        value: currentTransactions.successRate,
        change: 0, // Can be enhanced with previous period comparison
      },
      totalSettlements: {
        value: currentSettlements.completed,
        change: this.calculatePercentageChange(
          currentSettlements.completed,
          prevSettlements.completed,
        ),
      },
      pendingSettlements: {
        value: currentSettlements.pending,
      },
      totalFees: {
        value: feeData.total,
        currency: 'USD',
      },
      activeCustomers: {
        value: customerData.count,
      },
    };

    await this.cacheManager.set(cacheKey, metrics, this.CACHE_TTL);
    return metrics;
  }

  async getRevenueData(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    interval: TimeInterval,
  ): Promise<RevenueResponseDto> {
    const cacheKey = `revenue:${merchantId}:${startDate.getTime()}:${endDate.getTime()}:${interval}`;
    const cached = await this.cacheManager.get<RevenueResponseDto>(cacheKey);
    if (cached) return cached;

    const truncFunc = this.getTruncFunction(interval);

    const rawData = await this.settlementRepository
      .createQueryBuilder('s')
      .select(`DATE_TRUNC('${truncFunc}', s.settled_at) as date`)
      .addSelect('SUM(s.net_amount)', 'amount')
      .addSelect('COUNT(s.id)', 'count')
      .addSelect('s.currency', 'currency')
      .where('s.merchant_id = :merchantId', { merchantId })
      .andWhere('s.settled_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('s.status = :status', { status: SettlementStatus.COMPLETED })
      .groupBy('date')
      .addGroupBy('s.currency')
      .orderBy('date', 'ASC')
      .getRawMany();

    const data = rawData.map((d) => ({
      date: d.date,
      amount: parseFloat(d.amount) || 0,
      currency: d.currency,
      count: parseInt(d.count, 10) || 0,
    }));

    const total = data.reduce((sum, item) => sum + item.amount, 0);

    // Calculate growth
    const duration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - duration);
    const prevTotal = await this.getTotalRevenue(
      merchantId,
      prevStartDate,
      startDate,
    );
    const growth = this.calculatePercentageChange(total, prevTotal.total);

    const response: RevenueResponseDto = {
      data,
      total,
      currency: 'USD',
      growth,
    };

    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  async getTransactionTrendsData(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    interval: TimeInterval,
  ): Promise<TransactionTrendsResponseDto> {
    const cacheKey = `trends:${merchantId}:${startDate.getTime()}:${endDate.getTime()}:${interval}`;
    const cached =
      await this.cacheManager.get<TransactionTrendsResponseDto>(cacheKey);
    if (cached) return cached;

    const truncFunc = this.getTruncFunction(interval);

    const rawData = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select(`DATE_TRUNC('${truncFunc}', pr.created_at) as period`)
      .addSelect('COUNT(pr.id)', 'count')
      .addSelect('SUM(pr.amount)', 'volume')
      .addSelect(
        `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.COMPLETED}' THEN 1 END)`,
        'successCount',
      )
      .addSelect(
        `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.FAILED}' THEN 1 END)`,
        'failedCount',
      )
      .where('pr.merchant_id = :merchantId', { merchantId })
      .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    const trends: TransactionTrendDto[] = rawData.map((d) => {
      const count = parseInt(d.count, 10) || 0;
      const successCount = parseInt(d.successCount, 10) || 0;
      return {
        period: d.period,
        count,
        volume: parseFloat(d.volume) || 0,
        successCount,
        failedCount: parseInt(d.failedCount, 10) || 0,
        successRate: count > 0 ? (successCount / count) * 100 : 0,
      };
    });

    const summary = {
      totalCount: trends.reduce((sum, t) => sum + t.count, 0),
      totalVolume: trends.reduce((sum, t) => sum + t.volume, 0),
      averageSuccessRate:
        trends.length > 0
          ? trends.reduce((sum, t) => sum + t.successRate, 0) / trends.length
          : 0,
    };

    const response: TransactionTrendsResponseDto = { trends, summary };
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  async getSettlementStatistics(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SettlementStatisticsDto> {
    const cacheKey = `settlement-stats:${merchantId}:${startDate.getTime()}:${endDate.getTime()}`;
    const cached =
      await this.cacheManager.get<SettlementStatisticsDto>(cacheKey);
    if (cached) return cached;

    const rawData = await this.settlementRepository
      .createQueryBuilder('s')
      .select('COUNT(s.id)', 'total')
      .addSelect(
        `COUNT(CASE WHEN s.status = '${SettlementStatus.COMPLETED}' THEN 1 END)`,
        'completed',
      )
      .addSelect(
        `COUNT(CASE WHEN s.status = '${SettlementStatus.PENDING}' THEN 1 END)`,
        'pending',
      )
      .addSelect(
        `COUNT(CASE WHEN s.status = '${SettlementStatus.FAILED}' THEN 1 END)`,
        'failed',
      )
      .addSelect('SUM(s.net_amount)', 'totalAmount')
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM (s.settled_at - s.created_at)) / 3600)',
        'avgTime',
      )
      .where('s.merchant_id = :merchantId', { merchantId })
      .andWhere('s.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const total = parseInt(rawData.total, 10) || 0;
    const completed = parseInt(rawData.completed, 10) || 0;

    const stats: SettlementStatisticsDto = {
      total,
      completed,
      pending: parseInt(rawData.pending, 10) || 0,
      failed: parseInt(rawData.failed, 10) || 0,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      averageSettlementTime: parseFloat(rawData.avgTime) || 0,
      totalAmount: parseFloat(rawData.totalAmount) || 0,
      currency: 'USD',
    };

    await this.cacheManager.set(cacheKey, stats, this.CACHE_TTL);
    return stats;
  }

  async getNetworkUsage(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<NetworkUsageResponseDto> {
    const cacheKey = `network-usage:${merchantId}:${startDate.getTime()}:${endDate.getTime()}`;
    const cached =
      await this.cacheManager.get<NetworkUsageResponseDto>(cacheKey);
    if (cached) return cached;

    const rawData = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select('pr.stellar_network', 'network')
      .addSelect('COUNT(pr.id)', 'transactionCount')
      .addSelect('SUM(pr.amount)', 'volume')
      .addSelect('AVG(pr.amount)', 'averageValue')
      .addSelect(
        `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.COMPLETED}' THEN 1 END)`,
        'successCount',
      )
      .where('pr.merchant_id = :merchantId', { merchantId })
      .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('pr.stellar_network IS NOT NULL')
      .groupBy('pr.stellar_network')
      .getRawMany();

    const totalTransactions = rawData.reduce(
      (sum, d) => sum + (parseInt(d.transactionCount, 10) || 0),
      0,
    );

    const networks: NetworkUsageDto[] = rawData.map((d) => {
      const transactionCount = parseInt(d.transactionCount, 10) || 0;
      const successCount = parseInt(d.successCount, 10) || 0;
      return {
        network: d.network || 'Unknown',
        transactionCount,
        volume: parseFloat(d.volume) || 0,
        percentage:
          totalTransactions > 0
            ? (transactionCount / totalTransactions) * 100
            : 0,
        averageValue: parseFloat(d.averageValue) || 0,
        successRate:
          transactionCount > 0 ? (successCount / transactionCount) * 100 : 0,
      };
    });

    const mostPopular =
      networks.length > 0
        ? networks.reduce((max, n) =>
            n.transactionCount > max.transactionCount ? n : max,
          ).network
        : 'N/A';

    const response: NetworkUsageResponseDto = { networks, mostPopular };
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  async getPerformanceMetrics(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceMetricsDto> {
    const cacheKey = `performance:${merchantId}:${startDate.getTime()}:${endDate.getTime()}`;
    const cached = await this.cacheManager.get<PerformanceMetricsDto>(cacheKey);
    if (cached) return cached;

    const [paymentData, settlementData] = await Promise.all([
      this.paymentRequestRepository
        .createQueryBuilder('pr')
        .select('COUNT(pr.id)', 'total')
        .addSelect(
          `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.COMPLETED}' THEN 1 END)`,
          'success',
        )
        .addSelect(
          `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.FAILED}' THEN 1 END)`,
          'failed',
        )
        .addSelect(
          'AVG(EXTRACT(EPOCH FROM (pr.completed_at - pr.created_at)))',
          'avgProcessingTime',
        )
        .where('pr.merchant_id = :merchantId', { merchantId })
        .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getRawOne(),
      this.settlementRepository
        .createQueryBuilder('s')
        .select('COUNT(s.id)', 'total')
        .addSelect(
          `COUNT(CASE WHEN s.status = '${SettlementStatus.COMPLETED}' THEN 1 END)`,
          'success',
        )
        .addSelect(
          'AVG(EXTRACT(EPOCH FROM (s.settled_at - s.created_at)) / 3600)',
          'avgSettlementTime',
        )
        .addSelect(
          `COUNT(CASE WHEN s.retry_count > 0 AND s.status = '${SettlementStatus.COMPLETED}' THEN 1 END)`,
          'retrySuccess',
        )
        .addSelect(
          'COUNT(CASE WHEN s.retry_count > 0 THEN 1 END)',
          'totalRetries',
        )
        .where('s.merchant_id = :merchantId', { merchantId })
        .andWhere('s.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getRawOne(),
    ]);

    const paymentTotal = parseInt(paymentData.total, 10) || 0;
    const paymentSuccess = parseInt(paymentData.success, 10) || 0;
    const settlementTotal = parseInt(settlementData.total, 10) || 0;
    const settlementSuccess = parseInt(settlementData.success, 10) || 0;
    const totalRetries = parseInt(settlementData.totalRetries, 10) || 0;
    const retrySuccess = parseInt(settlementData.retrySuccess, 10) || 0;

    const metrics: PerformanceMetricsDto = {
      overallSuccessRate:
        paymentTotal > 0 ? (paymentSuccess / paymentTotal) * 100 : 0,
      paymentSuccessRate:
        paymentTotal > 0 ? (paymentSuccess / paymentTotal) * 100 : 0,
      settlementSuccessRate:
        settlementTotal > 0 ? (settlementSuccess / settlementTotal) * 100 : 0,
      averageProcessingTime: parseFloat(paymentData.avgProcessingTime) || 0,
      averageSettlementTime: parseFloat(settlementData.avgSettlementTime) || 0,
      failedTransactions: parseInt(paymentData.failed, 10) || 0,
      retrySuccessRate:
        totalRetries > 0 ? (retrySuccess / totalRetries) * 100 : 0,
    };

    await this.cacheManager.set(cacheKey, metrics, this.CACHE_TTL);
    return metrics;
  }

  async getCustomerInsights(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CustomerInsightDto> {
    const cacheKey = `customer-insights:${merchantId}:${startDate.getTime()}:${endDate.getTime()}`;
    const cached = await this.cacheManager.get<CustomerInsightDto>(cacheKey);
    if (cached) return cached;

    // Get unique customers and their stats
    const customerData = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select('pr.customer_email', 'email')
      .addSelect('COUNT(pr.id)', 'transactionCount')
      .addSelect('SUM(pr.amount)', 'totalVolume')
      .addSelect('MIN(pr.created_at)', 'firstTransaction')
      .where('pr.merchant_id = :merchantId', { merchantId })
      .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('pr.customer_email IS NOT NULL')
      .andWhere('pr.status = :status', {
        status: PaymentRequestStatus.COMPLETED,
      })
      .groupBy('pr.customer_email')
      .getRawMany();

    const totalCustomers = customerData.length;
    const newCustomers = customerData.filter((c) => {
      const firstTx = new Date(c.firstTransaction);
      return firstTx >= startDate && firstTx <= endDate;
    }).length;

    const totalTransactions = customerData.reduce(
      (sum, c) => sum + (parseInt(c.transactionCount, 10) || 0),
      0,
    );
    const totalVolume = customerData.reduce(
      (sum, c) => sum + (parseFloat(c.totalVolume) || 0),
      0,
    );

    const topCustomers = customerData
      .map((c) => ({
        email: c.email,
        transactionCount: parseInt(c.transactionCount, 10) || 0,
        totalVolume: parseFloat(c.totalVolume) || 0,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10);

    const insights: CustomerInsightDto = {
      totalCustomers,
      newCustomers,
      returningCustomers: totalCustomers - newCustomers,
      averageTransactionsPerCustomer:
        totalCustomers > 0 ? totalTransactions / totalCustomers : 0,
      averageCustomerValue:
        totalCustomers > 0 ? totalVolume / totalCustomers : 0,
      topCustomers,
    };

    await this.cacheManager.set(cacheKey, insights, this.CACHE_TTL);
    return insights;
  }

  // Helper methods
  private async getTotalRevenue(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total: number }> {
    const result = await this.settlementRepository
      .createQueryBuilder('s')
      .select('SUM(s.net_amount)', 'total')
      .where('s.merchant_id = :merchantId', { merchantId })
      .andWhere('s.settled_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('s.status = :status', { status: SettlementStatus.COMPLETED })
      .getRawOne();

    return { total: parseFloat(result.total) || 0 };
  }

  private async getTransactionCount(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total: number; successRate: number }> {
    const result = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select('COUNT(pr.id)', 'total')
      .addSelect(
        `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.COMPLETED}' THEN 1 END)`,
        'success',
      )
      .where('pr.merchant_id = :merchantId', { merchantId })
      .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const total = parseInt(result.total, 10) || 0;
    const success = parseInt(result.success, 10) || 0;

    return {
      total,
      successRate: total > 0 ? (success / total) * 100 : 0,
    };
  }

  private async getSettlementCount(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ completed: number; pending: number }> {
    const result = await this.settlementRepository
      .createQueryBuilder('s')
      .select(
        `COUNT(CASE WHEN s.status = '${SettlementStatus.COMPLETED}' THEN 1 END)`,
        'completed',
      )
      .addSelect(
        `COUNT(CASE WHEN s.status = '${SettlementStatus.PENDING}' THEN 1 END)`,
        'pending',
      )
      .where('s.merchant_id = :merchantId', { merchantId })
      .andWhere('s.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      completed: parseInt(result.completed, 10) || 0,
      pending: parseInt(result.pending, 10) || 0,
    };
  }

  private async getTotalFees(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total: number }> {
    const result = await this.settlementRepository
      .createQueryBuilder('s')
      .select('SUM(s.fee_amount)', 'total')
      .where('s.merchant_id = :merchantId', { merchantId })
      .andWhere('s.processed_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return { total: parseFloat(result.total) || 0 };
  }

  private async getActiveCustomers(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ count: number }> {
    const result = await this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select('COUNT(DISTINCT pr.customer_email)', 'count')
      .where('pr.merchant_id = :merchantId', { merchantId })
      .andWhere('pr.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('pr.customer_email IS NOT NULL')
      .getRawOne();

    return { count: parseInt(result.count, 10) || 0 };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private getTruncFunction(interval: TimeInterval): string {
    switch (interval) {
      case TimeInterval.HOUR:
        return 'hour';
      case TimeInterval.DAY:
        return 'day';
      case TimeInterval.WEEK:
        return 'week';
      case TimeInterval.MONTH:
        return 'month';
      default:
        return 'day';
    }
  }
}
