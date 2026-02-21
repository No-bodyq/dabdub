import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { AnalyticsService } from './analytics.service';
import { Settlement } from '../settlement/entities/settlement.entity';
import { PaymentRequest } from '../database/entities/payment-request.entity';
import { ReportType, ReportFormat } from './dto/report.dto';
import { TimeInterval } from './dto/date-range.dto';

interface ReportJob {
  id: string;
  type: ReportType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  merchantId: string;
  startDate: Date;
  endDate: Date;
  format: ReportFormat;
  createdAt: Date;
  completedAt?: Date;
  data?: string;
  error?: string;
}

@Injectable()
export class ReportService {
  private reports: Map<string, ReportJob> = new Map();

  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
    @InjectRepository(PaymentRequest)
    private paymentRequestRepository: Repository<PaymentRequest>,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

  async generateReport(
    merchantId: string,
    type: ReportType,
    startDate: Date,
    endDate: Date,
    format: ReportFormat,
  ): Promise<string> {
    const reportId = this.generateReportId();
    const job: ReportJob = {
      id: reportId,
      type,
      status: 'pending',
      merchantId,
      startDate,
      endDate,
      format,
      createdAt: new Date(),
    };

    this.reports.set(reportId, job);

    // Process report asynchronously
    this.processReport(reportId).catch((error: any) => {
      const job = this.reports.get(reportId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
      }
    });

    return reportId;
  }

  async getReportStatus(reportId: string): Promise<ReportJob | null> {
    return this.reports.get(reportId) || null;
  }

  async downloadReport(reportId: string): Promise<string> {
    const job = this.reports.get(reportId);
    if (!job) {
      throw new Error('Report not found');
    }

    if (job.status !== 'completed') {
      throw new Error(`Report is ${job.status}`);
    }

    return job.data || '';
  }

  private async processReport(reportId: string): Promise<void> {
    const job = this.reports.get(reportId);
    if (!job) return;

    job.status = 'processing';

    try {
      let data: string;

      switch (job.type) {
        case ReportType.REVENUE:
          data = await this.generateRevenueReport(job);
          break;
        case ReportType.TRANSACTIONS:
          data = await this.generateTransactionsReport(job);
          break;
        case ReportType.SETTLEMENTS:
          data = await this.generateSettlementsReport(job);
          break;
        case ReportType.COMPREHENSIVE:
          data = await this.generateComprehensiveReport(job);
          break;
        default:
          throw new Error('Unknown report type');
      }

      job.data = data;
      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error: any) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  private async generateRevenueReport(job: ReportJob): Promise<string> {
    const revenue = await this.analyticsService.getRevenueData(
      job.merchantId,
      job.startDate,
      job.endDate,
      TimeInterval.DAY,
    );

    if (job.format === ReportFormat.JSON) {
      return JSON.stringify(revenue, null, 2);
    }

    // CSV format
    let csv = 'Revenue Report\n';
    csv += `Period,${job.startDate.toISOString()} - ${job.endDate.toISOString()}\n`;
    csv += `Total Revenue,${revenue.total},${revenue.currency}\n`;
    csv += `Growth,${revenue.growth.toFixed(2)}%\n\n`;
    csv += 'Date,Amount,Currency,Transaction Count\n';
    revenue.data.forEach((d) => {
      csv += `${d.date},${d.amount},${d.currency},${d.count}\n`;
    });

    return csv;
  }

  private async generateTransactionsReport(job: ReportJob): Promise<string> {
    const trends = await this.analyticsService.getTransactionTrendsData(
      job.merchantId,
      job.startDate,
      job.endDate,
      TimeInterval.DAY,
    );

    if (job.format === ReportFormat.JSON) {
      return JSON.stringify(trends, null, 2);
    }

    // CSV format
    let csv = 'Transaction Trends Report\n';
    csv += `Period,${job.startDate.toISOString()} - ${job.endDate.toISOString()}\n`;
    csv += `Total Transactions,${trends.summary.totalCount}\n`;
    csv += `Total Volume,${trends.summary.totalVolume}\n`;
    csv += `Average Success Rate,${trends.summary.averageSuccessRate.toFixed(2)}%\n\n`;
    csv += 'Period,Count,Volume,Success Count,Failed Count,Success Rate\n';
    trends.trends.forEach((t) => {
      csv += `${t.period},${t.count},${t.volume},${t.successCount},${t.failedCount},${t.successRate.toFixed(2)}%\n`;
    });

    return csv;
  }

  private async generateSettlementsReport(job: ReportJob): Promise<string> {
    const stats = await this.analyticsService.getSettlementStatistics(
      job.merchantId,
      job.startDate,
      job.endDate,
    );

    if (job.format === ReportFormat.JSON) {
      return JSON.stringify(stats, null, 2);
    }

    // CSV format
    let csv = 'Settlement Statistics Report\n';
    csv += `Period,${job.startDate.toISOString()} - ${job.endDate.toISOString()}\n`;
    csv += `Total Settlements,${stats.total}\n`;
    csv += `Completed,${stats.completed}\n`;
    csv += `Pending,${stats.pending}\n`;
    csv += `Failed,${stats.failed}\n`;
    csv += `Success Rate,${stats.successRate.toFixed(2)}%\n`;
    csv += `Average Settlement Time,${stats.averageSettlementTime.toFixed(2)} hours\n`;
    csv += `Total Amount,${stats.totalAmount},${stats.currency}\n`;

    return csv;
  }

  private async generateComprehensiveReport(job: ReportJob): Promise<string> {
    const [
      dashboard,
      revenue,
      trends,
      settlements,
      network,
      performance,
      customers,
    ] = await Promise.all([
      this.analyticsService.getDashboardMetrics(
        job.merchantId,
        job.startDate,
        job.endDate,
      ),
      this.analyticsService.getRevenueData(
        job.merchantId,
        job.startDate,
        job.endDate,
        TimeInterval.DAY,
      ),
      this.analyticsService.getTransactionTrendsData(
        job.merchantId,
        job.startDate,
        job.endDate,
        TimeInterval.DAY,
      ),
      this.analyticsService.getSettlementStatistics(
        job.merchantId,
        job.startDate,
        job.endDate,
      ),
      this.analyticsService.getNetworkUsage(
        job.merchantId,
        job.startDate,
        job.endDate,
      ),
      this.analyticsService.getPerformanceMetrics(
        job.merchantId,
        job.startDate,
        job.endDate,
      ),
      this.analyticsService.getCustomerInsights(
        job.merchantId,
        job.startDate,
        job.endDate,
      ),
    ]);

    if (job.format === ReportFormat.JSON) {
      return JSON.stringify(
        {
          dashboard,
          revenue,
          trends,
          settlements,
          network,
          performance,
          customers,
        },
        null,
        2,
      );
    }

    // CSV format
    let csv = 'Comprehensive Analytics Report\n';
    csv += `Period,${job.startDate.toISOString()} - ${job.endDate.toISOString()}\n\n`;

    csv += 'Dashboard Metrics\n';
    csv += `Total Revenue,${dashboard.totalRevenue.value},${dashboard.totalRevenue.currency}\n`;
    csv += `Total Transactions,${dashboard.totalTransactions.value}\n`;
    csv += `Average Transaction Value,${dashboard.averageTransactionValue.value}\n`;
    csv += `Success Rate,${dashboard.successRate.value}%\n`;
    csv += `Total Settlements,${dashboard.totalSettlements.value}\n`;
    csv += `Pending Settlements,${dashboard.pendingSettlements.value}\n`;
    csv += `Total Fees,${dashboard.totalFees.value}\n`;
    csv += `Active Customers,${dashboard.activeCustomers.value}\n\n`;

    csv += 'Performance Metrics\n';
    csv += `Overall Success Rate,${performance.overallSuccessRate.toFixed(2)}%\n`;
    csv += `Payment Success Rate,${performance.paymentSuccessRate.toFixed(2)}%\n`;
    csv += `Settlement Success Rate,${performance.settlementSuccessRate.toFixed(2)}%\n`;
    csv += `Average Processing Time,${performance.averageProcessingTime.toFixed(2)} seconds\n`;
    csv += `Average Settlement Time,${performance.averageSettlementTime.toFixed(2)} hours\n\n`;

    csv += 'Network Usage\n';
    csv += 'Network,Transaction Count,Volume,Percentage,Success Rate\n';
    network.networks.forEach((n) => {
      csv += `${n.network},${n.transactionCount},${n.volume},${n.percentage.toFixed(2)}%,${n.successRate.toFixed(2)}%\n`;
    });
    csv += '\n';

    csv += 'Customer Insights\n';
    csv += `Total Customers,${customers.totalCustomers}\n`;
    csv += `New Customers,${customers.newCustomers}\n`;
    csv += `Returning Customers,${customers.returningCustomers}\n`;
    csv += `Average Transactions Per Customer,${customers.averageTransactionsPerCustomer.toFixed(2)}\n`;
    csv += `Average Customer Value,${customers.averageCustomerValue.toFixed(2)}\n`;

    return csv;
  }

  async generateMerchantReportCsv(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const volume = await this.analyticsService.getPaymentVolume(
      merchantId,
      startDate,
      endDate,
    );
    const revenue = await this.analyticsService.getMerchantRevenue(merchantId);
    const trends = await this.analyticsService.getTransactionTrends(
      merchantId,
      startDate,
      endDate,
      'day',
    );

    // Simple CSV construction
    let csv = 'Report Type,Merchant Report\n';
    csv += `Period,${startDate.toISOString()} - ${endDate.toISOString()}\n\n`;

    csv += 'Summary Metrics\n';
    csv += 'Metric,Currency,Value\n';
    volume.forEach((v: any) => {
      csv += `Payment Volume,${v.currency},${v.totalVolume}\n`;
    });
    revenue.forEach((r: any) => {
      csv += `Net Revenue,${r.currency},${r.totalRevenue}\n`;
    });
    csv += '\n';

    csv += 'Daily Trends\n';
    csv += 'Date,Currency,Volume,Count\n';
    trends.forEach((t: any) => {
      csv += `${t.period},${t.currency},${t.volume},${t.count}\n`;
    });

    return csv;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
