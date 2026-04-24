import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentNetwork, PaymentStatus } from '../payments/entities/payment.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private cache = new Map<string, { data: any; expiry: number }>();

  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
  ) {}

  private async getCachedData(key: string, fetchFn: () => Promise<any>, ttl = 60000) {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      this.logger.debug(`Cache hit for ${key}`);
      return { ...cached.data, cacheHit: true };
    }
    this.logger.debug(`Cache miss for ${key}`);
    const data = await fetchFn();
    this.cache.set(key, { data, expiry: Date.now() + ttl });
    return { ...data, cacheHit: false };
  }

  private getPeriodBounds(period: 'daily' | 'monthly'): { currentStart: Date; currentEnd: Date; prevStart: Date; prevEnd: Date } {
    const now = new Date();
    if (period === 'daily') {
      const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return { currentStart, currentEnd, prevStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), prevEnd: currentStart };
    }
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { currentStart, currentEnd, prevStart: new Date(now.getFullYear(), now.getMonth() - 1, 1), prevEnd: currentStart };
  }

  private pctChange(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }

  async getVolume(merchantId: string, period: 'daily' | 'monthly', compareWith?: 'previous') {
    const cacheKey = `volume:${merchantId}:${period}:${compareWith ?? 'none'}`;
    return this.getCachedData(cacheKey, async () => {
      const dateFormat = period === 'daily' ? 'YYYY-MM-DD' : 'YYYY-MM';

      const fetchSeries = (start?: Date, end?: Date) => {
        const qb = this.paymentsRepo
          .createQueryBuilder('payment')
          .select(`TO_CHAR(payment.createdAt, '${dateFormat}')`, 'date')
          .addSelect('SUM(payment.amountUsd)', 'volume')
          .addSelect('COUNT(*)', 'count')
          .where('payment.merchantId = :merchantId', { merchantId })
          .andWhere('payment.status = :status', { status: PaymentStatus.SETTLED });
        if (start) qb.andWhere('payment.createdAt >= :start', { start });
        if (end) qb.andWhere('payment.createdAt < :end', { end });
        return qb.groupBy('date').orderBy('date', 'ASC').getRawMany();
      };

      if (compareWith !== 'previous') {
        return { results: await fetchSeries() };
      }

      const { currentStart, currentEnd, prevStart, prevEnd } = this.getPeriodBounds(period);
      const [current, previous] = await Promise.all([
        fetchSeries(currentStart, currentEnd),
        fetchSeries(prevStart, prevEnd),
      ]);

      const sumVolume = (rows: any[]) => rows.reduce((s, r) => s + parseFloat(r.volume || 0), 0);
      const sumCount = (rows: any[]) => rows.reduce((s, r) => s + parseInt(r.count || 0), 0);

      const currentVolume = sumVolume(current);
      const prevVolume = sumVolume(previous);
      const currentCount = sumCount(current);
      const prevCount = sumCount(previous);

      return {
        current: { results: current, totalVolume: currentVolume, totalCount: currentCount },
        previous: { results: previous, totalVolume: prevVolume, totalCount: prevCount },
        changes: {
          volume: this.pctChange(currentVolume, prevVolume),
          count: this.pctChange(currentCount, prevCount),
        },
      };
    });
  }

  async getFunnel(merchantId: string, compareWith?: 'previous') {
    const cacheKey = `funnel:${merchantId}:${compareWith ?? 'none'}`;
    return this.getCachedData(cacheKey, async () => {
      const fetchCounts = async (start?: Date, end?: Date) => {
        const qb = this.paymentsRepo
          .createQueryBuilder('payment')
          .select('payment.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('payment.merchantId = :merchantId', { merchantId });
        if (start) qb.andWhere('payment.createdAt >= :start', { start });
        if (end) qb.andWhere('payment.createdAt < :end', { end });
        const stats = await qb.groupBy('payment.status').getRawMany();

        const counts = { total: 0, pending: 0, confirmed: 0, settling: 0, settled: 0, failed: 0, expired: 0 };
        stats.forEach((s) => { counts[s.status] = parseInt(s.count); counts.total += parseInt(s.count); });
        return {
          counts,
          percentages: {
            conversionRate: counts.total > 0 ? (counts.settled / counts.total) * 100 : 0,
            abandonmentRate: counts.total > 0 ? ((counts.expired + counts.failed) / counts.total) * 100 : 0,
          },
        };
      };

      if (compareWith !== 'previous') {
        return fetchCounts();
      }

      const { currentStart, currentEnd, prevStart, prevEnd } = this.getPeriodBounds('daily');
      const [current, previous] = await Promise.all([
        fetchCounts(currentStart, currentEnd),
        fetchCounts(prevStart, prevEnd),
      ]);

      return {
        current,
        previous,
        changes: {
          settled: this.pctChange(current.counts.settled, previous.counts.settled),
          total: this.pctChange(current.counts.total, previous.counts.total),
          conversionRate: this.pctChange(current.percentages.conversionRate, previous.percentages.conversionRate),
        },
      };
    });
  }

  async getComparison(merchantId: string, period: 'daily' | 'monthly') {
    const cacheKey = `comparison:${merchantId}:${period}`;
    return this.getCachedData(cacheKey, async () => {
      const now = new Date();
      let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;

      if (period === 'daily') {
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        prevEnd = currentStart;
      } else {
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = currentStart;
      }

      const [currentVolume, prevVolume] = await Promise.all([
        this.getVolumeForPeriod(merchantId, currentStart, currentEnd),
        this.getVolumeForPeriod(merchantId, prevStart, prevEnd),
      ]);

      const growth = prevVolume > 0 ? ((currentVolume - prevVolume) / prevVolume) * 100 : (currentVolume > 0 ? 100 : 0);

      return {
        currentPeriod: { start: currentStart, end: currentEnd, volume: currentVolume },
        previousPeriod: { start: prevStart, end: prevEnd, volume: prevVolume },
        growth,
      };
    });
  }

  private async getVolumeForPeriod(merchantId: string, start: Date, end: Date): Promise<number> {
    const result = await this.paymentsRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amountUsd)', 'total')
      .where('payment.merchantId = :merchantId', { merchantId })
      .andWhere('payment.status = :status', { status: PaymentStatus.SETTLED })
      .andWhere('payment.createdAt >= :start', { start })
      .andWhere('payment.createdAt < :end', { end })
      .getRawOne();

    return parseFloat(result?.total || 0);
  }

  async getNetworkBreakdown(merchantId: string, sortBy: 'volume' | 'count' = 'volume', period: 'daily' | 'monthly' = 'daily') {
    const cacheKey = `networks:${merchantId}:${sortBy}:${period}`;
    return this.getCachedData(cacheKey, async () => {
      const dateFormat = period === 'daily' ? 'YYYY-MM-DD' : 'YYYY-MM';

      const [rows, trendRows] = await Promise.all([
        this.paymentsRepo
          .createQueryBuilder('payment')
          .select('payment.network', 'network')
          .addSelect('COUNT(*)', 'count')
          .addSelect('COALESCE(SUM(payment.amountUsd), 0)', 'volumeUsd')
          .where('payment.merchantId = :merchantId', { merchantId })
          .andWhere('payment.status = :status', { status: PaymentStatus.SETTLED })
          .groupBy('payment.network')
          .getRawMany(),
        this.paymentsRepo
          .createQueryBuilder('payment')
          .select('payment.network', 'network')
          .addSelect(`TO_CHAR(payment.createdAt, '${dateFormat}')`, 'date')
          .addSelect('COUNT(*)', 'count')
          .addSelect('COALESCE(SUM(payment.amountUsd), 0)', 'volumeUsd')
          .where('payment.merchantId = :merchantId', { merchantId })
          .andWhere('payment.status = :status', { status: PaymentStatus.SETTLED })
          .groupBy('payment.network')
          .addGroupBy('date')
          .orderBy('date', 'ASC')
          .getRawMany(),
      ]);

      const totals = rows.reduce((s, r) => ({ volume: s.volume + parseFloat(r.volumeUsd), count: s.count + parseInt(r.count) }), { volume: 0, count: 0 });

      const byNetwork = new Map(rows.map((r) => [r.network, { count: parseInt(r.count), volumeUsd: parseFloat(r.volumeUsd) }]));

      const trendByNetwork = new Map<string, { date: string; count: number; volumeUsd: number }[]>();
      for (const r of trendRows) {
        if (!trendByNetwork.has(r.network)) trendByNetwork.set(r.network, []);
        trendByNetwork.get(r.network).push({ date: r.date, count: parseInt(r.count), volumeUsd: parseFloat(r.volumeUsd) });
      }

      const networks = Object.values(PaymentNetwork).map((network) => {
        const data = byNetwork.get(network) ?? { count: 0, volumeUsd: 0 };
        return {
          network,
          count: data.count,
          volumeUsd: data.volumeUsd,
          percentOfTotal: totals.volume > 0 ? parseFloat(((data.volumeUsd / totals.volume) * 100).toFixed(2)) : 0,
          trend: trendByNetwork.get(network) ?? [],
        };
      });

      networks.sort((a, b) => (sortBy === 'count' ? b.count - a.count : b.volumeUsd - a.volumeUsd));

      return { networks, totals };
    });
  }

  clearCache() {
    this.cache.clear();
  }
}
