import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ReportService } from './report.service';
import { Response } from 'express';
import { TimeInterval } from './dto/date-range.dto';
import { ReportType, ReportFormat } from './dto/report.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;
  let reportService: ReportService;

  const mockAnalyticsService = {
    getDashboardMetrics: jest.fn(),
    getRevenueData: jest.fn(),
    getTransactionTrendsData: jest.fn(),
    getSettlementStatistics: jest.fn(),
    getNetworkUsage: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    getCustomerInsights: jest.fn(),
    getPaymentVolume: jest.fn(),
    getSettlementSuccessRate: jest.fn(),
    getMerchantRevenue: jest.fn(),
    getTransactionTrends: jest.fn(),
    getFeeAnalysis: jest.fn(),
    getMerchantGrowth: jest.fn(),
  };

  const mockReportService = {
    generateReport: jest.fn(),
    getReportStatus: jest.fn(),
    downloadReport: jest.fn(),
    generateMerchantReportCsv: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: ReportService,
          useValue: mockReportService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    reportService = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard metrics', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockMetrics = {
        totalRevenue: { value: 10000, change: 15.5, currency: 'USD' },
        totalTransactions: { value: 100, change: 10 },
        averageTransactionValue: { value: 100, change: 5, currency: 'USD' },
        successRate: { value: 95.5 },
        totalSettlements: { value: 95, change: 12 },
        pendingSettlements: { value: 5 },
        totalFees: { value: 200, currency: 'USD' },
        activeCustomers: { value: 50 },
      };

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getDashboard(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockMetrics);
      expect(analyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('getRevenue', () => {
    it('should return revenue data with default interval', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockRevenue = {
        data: [
          { date: '2024-01-01', amount: 1000, currency: 'USD', count: 10 },
          { date: '2024-01-02', amount: 1500, currency: 'USD', count: 15 },
        ],
        total: 2500,
        currency: 'USD',
        growth: 15.5,
      };

      mockAnalyticsService.getRevenueData.mockResolvedValue(mockRevenue);

      const result = await controller.getRevenue(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockRevenue);
      expect(analyticsService.getRevenueData).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
        TimeInterval.DAY,
      );
    });

    it('should return revenue data with custom interval', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';
      const interval = TimeInterval.WEEK;

      mockAnalyticsService.getRevenueData.mockResolvedValue({
        data: [],
        total: 0,
        currency: 'USD',
        growth: 0,
      });

      await controller.getRevenue(merchantId, startDate, endDate, interval);

      expect(analyticsService.getRevenueData).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
        TimeInterval.WEEK,
      );
    });
  });

  describe('getTransactionTrends', () => {
    it('should return transaction trends', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockTrends = {
        trends: [
          {
            period: '2024-01-01',
            count: 10,
            volume: 1000,
            successCount: 9,
            failedCount: 1,
            successRate: 90,
          },
        ],
        summary: {
          totalCount: 10,
          totalVolume: 1000,
          averageSuccessRate: 90,
        },
      };

      mockAnalyticsService.getTransactionTrendsData.mockResolvedValue(
        mockTrends,
      );

      const result = await controller.getTransactionTrends(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockTrends);
      expect(analyticsService.getTransactionTrendsData).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
        TimeInterval.DAY,
      );
    });
  });

  describe('getSettlementStatistics', () => {
    it('should return settlement statistics', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockStats = {
        total: 100,
        completed: 95,
        pending: 3,
        failed: 2,
        successRate: 95,
        averageSettlementTime: 2.5,
        totalAmount: 10000,
        currency: 'USD',
      };

      mockAnalyticsService.getSettlementStatistics.mockResolvedValue(mockStats);

      const result = await controller.getSettlementStatistics(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockStats);
      expect(analyticsService.getSettlementStatistics).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('getNetworkUsage', () => {
    it('should return network usage statistics', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockUsage = {
        networks: [
          {
            network: 'Polygon',
            transactionCount: 50,
            volume: 5000,
            percentage: 50,
            averageValue: 100,
            successRate: 95,
          },
          {
            network: 'Base',
            transactionCount: 30,
            volume: 3000,
            percentage: 30,
            averageValue: 100,
            successRate: 97,
          },
        ],
        mostPopular: 'Polygon',
      };

      mockAnalyticsService.getNetworkUsage.mockResolvedValue(mockUsage);

      const result = await controller.getNetworkUsage(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockUsage);
      expect(analyticsService.getNetworkUsage).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('getPerformance', () => {
    it('should return performance metrics', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockPerformance = {
        overallSuccessRate: 95.5,
        paymentSuccessRate: 96,
        settlementSuccessRate: 95,
        averageProcessingTime: 30,
        averageSettlementTime: 2.5,
        failedTransactions: 5,
        retrySuccessRate: 80,
      };

      mockAnalyticsService.getPerformanceMetrics.mockResolvedValue(
        mockPerformance,
      );

      const result = await controller.getPerformance(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockPerformance);
      expect(analyticsService.getPerformanceMetrics).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('getCustomerInsights', () => {
    it('should return customer insights', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockInsights = {
        totalCustomers: 50,
        newCustomers: 10,
        returningCustomers: 40,
        averageTransactionsPerCustomer: 2.5,
        averageCustomerValue: 200,
        topCustomers: [
          {
            email: 'customer1@example.com',
            transactionCount: 10,
            totalVolume: 1000,
          },
          {
            email: 'customer2@example.com',
            transactionCount: 8,
            totalVolume: 800,
          },
        ],
      };

      mockAnalyticsService.getCustomerInsights.mockResolvedValue(mockInsights);

      const result = await controller.getCustomerInsights(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockInsights);
      expect(analyticsService.getCustomerInsights).toHaveBeenCalledWith(
        merchantId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('generateReport', () => {
    it('should generate a report and return report ID', async () => {
      const generateDto = {
        type: ReportType.COMPREHENSIVE,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        format: ReportFormat.CSV,
        merchantId: 'merchant-123',
      };

      const mockReportId = 'report_123456';
      mockReportService.generateReport.mockResolvedValue(mockReportId);

      const result = await controller.generateReport(generateDto);

      expect(result.reportId).toBe(mockReportId);
      expect(result.status).toBe('pending');
      expect(result.type).toBe(ReportType.COMPREHENSIVE);
      expect(reportService.generateReport).toHaveBeenCalledWith(
        'merchant-123',
        ReportType.COMPREHENSIVE,
        new Date(generateDto.startDate),
        new Date(generateDto.endDate),
        ReportFormat.CSV,
      );
    });
  });

  describe('downloadReport', () => {
    it('should download a completed report', async () => {
      const reportId = 'report_123456';
      const mockReport = {
        id: reportId,
        status: 'completed' as const,
        type: ReportType.REVENUE,
        merchantId: 'merchant-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        format: ReportFormat.CSV,
        createdAt: new Date(),
        data: 'CSV data here',
      };

      mockReportService.getReportStatus.mockResolvedValue(mockReport);
      mockReportService.downloadReport.mockResolvedValue('CSV data here');

      const mockResponse = {
        header: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.downloadReport(reportId, mockResponse);

      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=report-${reportId}.csv`,
      );
      expect(mockResponse.send).toHaveBeenCalledWith('CSV data here');
    });

    it('should return 404 if report not found', async () => {
      const reportId = 'nonexistent';
      mockReportService.getReportStatus.mockResolvedValue(null);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.downloadReport(reportId, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report not found',
      });
    });

    it('should return 202 if report is still processing', async () => {
      const reportId = 'report_123456';
      const mockReport = {
        id: reportId,
        status: 'processing' as const,
        type: ReportType.REVENUE,
        merchantId: 'merchant-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        format: ReportFormat.CSV,
        createdAt: new Date(),
      };

      mockReportService.getReportStatus.mockResolvedValue(mockReport);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.downloadReport(reportId, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(202);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report is processing',
        status: 'processing',
      });
    });
  });

  describe('Legacy endpoints', () => {
    it('should handle legacy exportReport', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockReportService.generateMerchantReportCsv.mockResolvedValue('CSV data');

      const mockResponse = {
        header: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportReport(
        merchantId,
        startDate,
        endDate,
        mockResponse,
      );

      expect(reportService.generateMerchantReportCsv).toHaveBeenCalled();
      expect(mockResponse.header).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.send).toHaveBeenCalledWith('CSV data');
    });

    it('should handle legacy getPaymentVolume', async () => {
      const merchantId = 'merchant-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockAnalyticsService.getPaymentVolume.mockResolvedValue([
        { currency: 'USD', totalVolume: 10000 },
      ]);

      const result = await controller.getPaymentVolume(
        merchantId,
        startDate,
        endDate,
      );

      expect(result).toEqual([{ currency: 'USD', totalVolume: 10000 }]);
      expect(analyticsService.getPaymentVolume).toHaveBeenCalled();
    });
  });
});
