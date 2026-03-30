import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Merchant } from '../entities/merchant.entity';
import { Transaction, TransactionType, TransactionStatus } from '../../transactions/entities/transaction.entity';
import { Settlement } from '../../settlement/entities/settlement.entity';
import {
  MerchantOverviewDto,
  RevenueTimelineDto,
  RevenueDataPointDto,
  RevenueGranularity,
} from './dto/merchant-overview.dto';

@Injectable()
export class MerchantAnalyticsService {
  private readonly logger = new Logger(MerchantAnalyticsService.name);

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Settlement)
    private readonly settlementRepo: Repository<Settlement>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get merchant overview statistics
   */
  async getOverview(merchantId: string): Promise<MerchantOverviewDto> {
    const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get transactions for the last 30 days
    const transactions = await this.transactionRepo
      .createQueryBuilder('tx')
      .where('tx.user_id = :merchantId', { merchantId })
      .andWhere('tx.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .getMany();

    // Calculate total revenue
    const totalRevenueUsdc30d = transactions.reduce(
      (sum, tx) => sum + parseFloat(tx.amountUsdc || '0'),
      0,
    ).toString();

    // Convert to NGN at settled rate (simplified - would need actual rate)
    const usdToNgnRate = parseFloat(this.configService.get('rates.usdToNgn') || '1500');
    const totalRevenueNgn30d = (parseFloat(totalRevenueUsdc30d) * usdToNgnRate).toString();

    // Get unique customers
    const uniqueCustomers = new Set(
      transactions
        .filter((tx) => tx.counterpartyUsername)
        .map((tx) => tx.counterpartyUsername),
    ).size;

    // Calculate average transaction
    const avgTransactionUsdc = transactions.length > 0
      ? (parseFloat(totalRevenueUsdc30d) / transactions.length).toString()
      : '0';

    // Get pending settlement
    const pendingSettlements = await this.settlementRepo
      .createQueryBuilder('settlement')
      .where('settlement.merchant_id = :merchantId', { merchantId })
      .andWhere('settlement.status = :status', { status: 'queued' })
      .getMany();

    const pendingSettlementUsdc = pendingSettlements.reduce(
      (sum: number, s: { usdcAmount: number }) => sum + s.usdcAmount,
      0,
    ).toString();

    // Get last settlement
    const lastSettlement = await this.settlementRepo.findOne({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });

    // Determine top payment method
    const paymentMethodCounts: Record<string, number> = {};
    transactions.forEach((tx) => {
      const method = this.getPaymentMethod(tx.type);
      paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1;
    });

    const topPaymentMethod = Object.entries(paymentMethodCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] || 'username_send';

    return {
      totalRevenueUsdc30d,
      totalRevenueNgn30d,
      transactionCount30d: transactions.length,
      uniqueCustomers30d: uniqueCustomers,
      avgTransactionUsdc,
      pendingSettlementUsdc,
      lastSettledAt: lastSettlement?.createdAt || null,
      topPaymentMethod,
    };
  }

  /**
   * Get revenue timeline with specified granularity
   */
  async getRevenueTimeline(
    merchantId: string,
    granularity: RevenueGranularity,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<RevenueTimelineDto> {
    const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    const transactions = await this.transactionRepo
      .createQueryBuilder('tx')
      .where('tx.user_id = :merchantId', { merchantId })
      .andWhere('tx.created_at >= :dateFrom', { dateFrom })
      .andWhere('tx.created_at <= :dateTo', { dateTo })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .orderBy('tx.created_at', 'ASC')
      .getMany();

    // Group by granularity
    const groupedData = this.groupTransactionsByGranularity(
      transactions,
      granularity,
    );

    const data: RevenueDataPointDto[] = groupedData.map((group) => ({
      timestamp: group.timestamp,
      revenueUsdc: group.revenue.toString(),
      transactionCount: group.count,
    }));

    return {
      granularity,
      data,
    };
  }

  /**
   * Group transactions by time granularity
   */
  private groupTransactionsByGranularity(
    transactions: Transaction[],
    granularity: RevenueGranularity,
  ): { timestamp: Date; revenue: number; count: number }[] {
    const groups: Map<string, { timestamp: Date; revenue: number; count: number }> = new Map();

    for (const tx of transactions) {
      const key = this.getGranularityKey(tx.createdAt, granularity);
      const existing = groups.get(key);

      if (existing) {
        existing.revenue += parseFloat(tx.amountUsdc || '0');
        existing.count += 1;
      } else {
        groups.set(key, {
          timestamp: this.getTimestampForKey(key, granularity),
          revenue: parseFloat(tx.amountUsdc || '0'),
          count: 1,
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  /**
   * Get a string key for grouping by granularity
   */
  private getGranularityKey(date: Date, granularity: RevenueGranularity): string {
    const d = new Date(date);
    switch (granularity) {
      case RevenueGranularity.HOUR:
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      case RevenueGranularity.DAY:
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      case RevenueGranularity.WEEK:
        const week = this.getWeekNumber(d);
        return `${d.getFullYear()}-W${week}`;
      case RevenueGranularity.MONTH:
        return `${d.getFullYear()}-${d.getMonth()}`;
      default:
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }
  }

  /**
   * Convert a granularity key back to a timestamp
   */
  private getTimestampForKey(key: string, granularity: RevenueGranularity): Date {
    const date = new Date();
    const parts = key.split(/[-W:]/);

    switch (granularity) {
      case RevenueGranularity.HOUR:
        date.setFullYear(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
        date.setHours(parseInt(parts[3]), 0, 0, 0);
        break;
      case RevenueGranularity.DAY:
        date.setFullYear(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
        date.setHours(0, 0, 0, 0);
        break;
      case RevenueGranularity.WEEK:
        date.setFullYear(parseInt(parts[0]), 0, 1);
        break;
      case RevenueGranularity.MONTH:
        date.setFullYear(parseInt(parts[0]), parseInt(parts[1]), 1);
        break;
    }

    return date;
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Map transaction type to payment method
   */
  private getPaymentMethod(type: TransactionType): string {
    switch (type) {
      case TransactionType.PAYLINK_RECEIVED:
        return 'paylink';
      case TransactionType.VIRTUAL_CARD_FUND:
        return 'virtual_account';
      default:
        return 'username_send';
    }
  }
}
