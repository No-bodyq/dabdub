import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { PaymentRequest, PaymentRequestStatus } from '../database/entities/payment-request.entity';
import {
  VolumeAnalyticsQueryDto,
  VolumeAnalyticsResponseDto,
  VolumePeriodDto,
  VolumePeriodGroupedDto,
  VolumeTotalsDto,
} from './dto/volume-analytics.dto';

@Injectable()
export class VolumeAnalyticsService {
  private readonly CACHE_TTL = 300; // 5 minutes per spec

  // Max date range limits per spec
  private readonly MAX_RANGES: Record<string, number> = {
    hour: 7,    // 7 days
    day: 365,   // 1 year
    week: 730,  // 2 years
    month: 730, // 2 years
  };

  constructor(
    @InjectRepository(PaymentRequest)
    private paymentRequestRepository: Repository<PaymentRequest>,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

  async getVolumeAnalytics(
    query: VolumeAnalyticsQueryDto,
  ): Promise<VolumeAnalyticsResponseDto> {
    // --- Validation ---
    this.validateDateRange(query);

    // --- Cache ---
    const cacheKey = this.buildCacheKey(query);
    const cached = await this.cacheManager.get<VolumeAnalyticsResponseDto>(cacheKey);
    if (cached) return cached;

    // --- Query ---
    const series = query.groupBy
      ? await this.queryGrouped(query)
      : await this.queryFlat(query);

    const totals = await this.queryTotals(query);

    const response: VolumeAnalyticsResponseDto = {
      granularity: query.granularity,
      startDate: query.startDate,
      endDate: query.endDate,
      series,
      totals,
    };

    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  // ── Flat series (no groupBy) with zero-fill ──────────────────────

  private async queryFlat(query: VolumeAnalyticsQueryDto): Promise<VolumePeriodDto[]> {
    const qb = this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select(`DATE_TRUNC('${query.granularity}', pr.created_at AT TIME ZONE 'UTC')`, 'period')
      .addSelect('COUNT(pr.id)', 'transactionCount')
      .addSelect('COALESCE(SUM(pr.amount), 0)', 'volumeUsd')
      .addSelect('COALESCE(SUM(pr.fee_amount), 0)', 'feesCollectedUsd')
      .addSelect(
        `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.COMPLETED}' THEN 1 END)`,
        'successCount',
      )
      .addSelect(
        `COUNT(CASE WHEN pr.status = '${PaymentRequestStatus.FAILED}' THEN 1 END)`,
        'failedCount',
      )
      .where('pr.created_at >= :startDate', { startDate: query.startDate })
      .andWhere('pr.created_at < :endDate', { endDate: query.endDate })
      .groupBy('period')
      .orderBy('period', 'ASC');

    this.applyFilters(qb, query);

    const rows = await qb.getRawMany();

    // Zero-fill gaps
    return this.zeroFillPeriods(rows, query).map((r) => ({
      period: r.period,
      transactionCount: parseInt(r.transactionCount, 10) || 0,
      volumeUsd: parseFloat(r.volumeUsd || '0').toFixed(2),
      feesCollectedUsd: parseFloat(r.feesCollectedUsd || '0').toFixed(2),
      successCount: parseInt(r.successCount, 10) || 0,
      failedCount: parseInt(r.failedCount, 10) || 0,
    }));
  }

  // ── Grouped series (with groupBy) ────────────────────────────────

  private async queryGrouped(
    query: VolumeAnalyticsQueryDto,
  ): Promise<VolumePeriodGroupedDto[]> {
    const groupColumn = this.resolveGroupColumn(query.groupBy!);

    const qb = this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select(`DATE_TRUNC('${query.granularity}', pr.created_at AT TIME ZONE 'UTC')`, 'period')
      .addSelect(groupColumn, 'groupKey')
      .addSelect('COUNT(pr.id)', 'transactionCount')
      .addSelect('COALESCE(SUM(pr.amount), 0)', 'volumeUsd')
      .where('pr.created_at >= :startDate', { startDate: query.startDate })
      .andWhere('pr.created_at < :endDate', { endDate: query.endDate })
      .groupBy('period')
      .addGroupBy('groupKey')
      .orderBy('period', 'ASC');

    this.applyFilters(qb, query);

    const rows = await qb.getRawMany();

    // Pivot flat rows into breakdown objects per period
    const periodMap = new Map<string, Record<string, { transactionCount: number; volumeUsd: string }>>();

    for (const row of rows) {
      const periodKey = new Date(row.period).toISOString();
      if (!periodMap.has(periodKey)) periodMap.set(periodKey, {});
      const breakdown = periodMap.get(periodKey)!;
      const key = row.groupKey ?? 'unknown';
      breakdown[key] = {
        transactionCount: parseInt(row.transactionCount, 10) || 0,
        volumeUsd: parseFloat(row.volumeUsd || '0').toFixed(2),
      };
    }

    return Array.from(periodMap.entries()).map(([period, breakdown]) => ({
      period,
      breakdown,
    }));
  }

  // ── Totals ────────────────────────────────────────────────────────

  private async queryTotals(query: VolumeAnalyticsQueryDto): Promise<VolumeTotalsDto> {
    const qb = this.paymentRequestRepository
      .createQueryBuilder('pr')
      .select('COUNT(pr.id)', 'transactionCount')
      .addSelect('COALESCE(SUM(pr.amount), 0)', 'volumeUsd')
      .addSelect('COALESCE(SUM(pr.fee_amount), 0)', 'feesCollectedUsd')
      .where('pr.created_at >= :startDate', { startDate: query.startDate })
      .andWhere('pr.created_at < :endDate', { endDate: query.endDate });

    this.applyFilters(qb, query);

    const row = await qb.getRawOne();
    return {
      transactionCount: parseInt(row.transactionCount, 10) || 0,
      volumeUsd: parseFloat(row.volumeUsd || '0').toFixed(2),
      feesCollectedUsd: parseFloat(row.feesCollectedUsd || '0').toFixed(2),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private applyFilters(qb: any, query: VolumeAnalyticsQueryDto): void {
    if (query.merchantId) {
      qb.andWhere('pr.merchant_id = :merchantId', { merchantId: query.merchantId });
    }
    if (query.chain) {
      qb.andWhere('pr.stellar_network = :chain', { chain: query.chain });
    }
    if (query.tokenSymbol) {
      qb.andWhere('pr.currency = :tokenSymbol', { tokenSymbol: query.tokenSymbol });
    }
  }

  private resolveGroupColumn(groupBy: string): string {
    switch (groupBy) {
      case 'chain':    return 'pr.stellar_network';
      case 'token':    return 'pr.currency';
      case 'merchant': return 'pr.merchant_id';
      case 'status':   return 'pr.status';
      default:         return 'pr.stellar_network';
    }
  }

  private validateDateRange(query: VolumeAnalyticsQueryDto): void {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    const now = new Date();

    // endDate cannot be in the future
    if (end > now) {
      throw new BadRequestException(
        'endDate cannot be in the future',
      );
    }

    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const maxDays = this.MAX_RANGES[query.granularity];

    if (diffDays > maxDays) {
      throw new BadRequestException(
        `Date range for '${query.granularity}' granularity cannot exceed ${maxDays} days. Provided range: ${Math.ceil(diffDays)} days.`,
      );
    }
  }

  private zeroFillPeriods(rows: any[], query: VolumeAnalyticsQueryDto): any[] {
    const rowMap = new Map(
      rows.map((r) => [new Date(r.period).toISOString(), r]),
    );

    const result: any[] = [];
    const cursor = new Date(query.startDate);
    const end = new Date(query.endDate);

    while (cursor < end) {
      const key = cursor.toISOString();
      result.push(
        rowMap.get(key) ?? {
          period: key,
          transactionCount: '0',
          volumeUsd: '0',
          feesCollectedUsd: '0',
          successCount: '0',
          failedCount: '0',
        },
      );
      this.advanceCursor(cursor, query.granularity);
    }

    return result;
  }

  private advanceCursor(cursor: Date, granularity: string): void {
    switch (granularity) {
      case 'hour':  cursor.setHours(cursor.getHours() + 1);   break;
      case 'day':   cursor.setDate(cursor.getDate() + 1);      break;
      case 'week':  cursor.setDate(cursor.getDate() + 7);      break;
      case 'month': cursor.setMonth(cursor.getMonth() + 1);    break;
    }
  }

  private buildCacheKey(query: VolumeAnalyticsQueryDto): string {
    const raw =
      query.startDate +
      query.endDate +
      query.granularity +
      (query.groupBy ?? '') +
      (query.merchantId ?? '') +
      (query.chain ?? '') +
      (query.tokenSymbol ?? '');
    return 'vol:' + crypto.createHash('md5').update(raw).digest('hex');
  }
}
