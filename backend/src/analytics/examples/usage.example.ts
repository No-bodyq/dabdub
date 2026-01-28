/**
 * Analytics Module Usage Examples
 * 
 * This file demonstrates how to use the analytics module in your application
 */

import { AnalyticsService } from '../analytics.service';
import { TimeInterval } from '../dto/date-range.dto';
import { ReportType, ReportFormat } from '../dto/report.dto';
import { DateUtils } from '../utils/date.utils';
import { ChartUtils } from '../utils/chart.utils';

/**
 * Example 1: Get Dashboard Metrics
 */
export async function getDashboardExample(analyticsService: AnalyticsService) {
  const merchantId = 'merchant-123';
  const { startDate, endDate } = DateUtils.getPresetRange('last30days');

  const metrics = await analyticsService.getDashboardMetrics(
    merchantId,
    startDate,
    endDate,
  );

  console.log('Total Revenue:', metrics.totalRevenue.value);
  console.log('Growth:', metrics.totalRevenue.change, '%');
  console.log('Success Rate:', metrics.successRate.value, '%');
}

/**
 * Example 2: Get Revenue Data for Charts
 */
export async function getRevenueChartExample(analyticsService: AnalyticsService) {
  const merchantId = 'merchant-123';
  const { startDate, endDate } = DateUtils.getPresetRange('last7days');

  const revenue = await analyticsService.getRevenueData(
    merchantId,
    startDate,
    endDate,
    TimeInterval.DAY,
  );

  // Convert to Chart.js format
  const chartData = ChartUtils.toChartJsFormat(
    revenue.data.map(d => ({ date: d.date, value: d.amount })),
    'Revenue',
  );

  console.log('Chart Data:', chartData);
}

/**
 * Example 3: Get Transaction Trends
 */
export async function getTransactionTrendsExample(analyticsService: AnalyticsService) {
  const merchantId = 'merchant-123';
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');

  const trends = await analyticsService.getTransactionTrendsData(
    merchantId,
    startDate,
    endDate,
    TimeInterval.WEEK,
  );

  console.log('Total Transactions:', trends.summary.totalCount);
  console.log('Average Success Rate:', trends.summary.averageSuccessRate, '%');

  // Convert to multi-series chart
  const chartData = ChartUtils.toMultiSeriesChartJs(
    trends.trends.map(t => ({
      date: t.period,
      success: t.successCount,
      failed: t.failedCount,
    })),
    [
      { key: 'success', label: 'Successful', color: 'rgb(75, 192, 192)' },
      { key: 'failed', label: 'Failed', color: 'rgb(255, 99, 132)' },
    ],
  );

  console.log('Chart Data:', chartData);
}

/**
 * Example 4: Get Network Usage for Pie Chart
 */
export async function getNetworkUsageExample(analyticsService: AnalyticsService) {
  const merchantId = 'merchant-123';
  const { startDate, endDate } = DateUtils.getPresetRange('thisMonth');

  const networkUsage = await analyticsService.getNetworkUsage(
    merchantId,
    startDate,
    endDate,
  );

  // Convert to pie chart format
  const chartData = ChartUtils.toPieChartFormat(
    networkUsage.networks.map(n => ({
      label: n.network,
      value: n.transactionCount,
    })),
  );

  console.log('Most Popular Network:', networkUsage.mostPopular);
  console.log('Chart Data:', chartData);
}

/**
 * Example 5: Get Customer Insights
 */
export async function getCustomerInsightsExample(analyticsService: AnalyticsService) {
  const merchantId = 'merchant-123';
  const { startDate, endDate } = DateUtils.getPresetRange('last30days');

  const insights = await analyticsService.getCustomerInsights(
    merchantId,
    startDate,
    endDate,
  );

  console.log('Total Customers:', insights.totalCustomers);
  console.log('New Customers:', insights.newCustomers);
  console.log('Average Customer Value:', insights.averageCustomerValue);
  console.log('Top Customers:', insights.topCustomers);
}

/**
 * Example 6: Generate and Download Report
 */
export async function generateReportExample(reportService: any) {
  const merchantId = 'merchant-123';
  const { startDate, endDate } = DateUtils.getPresetRange('last30days');

  // Generate report
  const reportId = await reportService.generateReport(
    merchantId,
    ReportType.COMPREHENSIVE,
    startDate,
    endDate,
    ReportFormat.CSV,
  );

  console.log('Report ID:', reportId);

  // Wait for report to complete (in real app, use polling or webhooks)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Download report
  const reportData = await reportService.downloadReport(reportId);
  console.log('Report Data:', reportData);
}

/**
 * Example 7: Using Date Presets
 */
export function datePresetsExample() {
  // Get today's data
  const today = DateUtils.getPresetRange('today');
  console.log('Today:', today);

  // Get last 7 days
  const last7Days = DateUtils.getPresetRange('last7days');
  console.log('Last 7 Days:', last7Days);

  // Get this month
  const thisMonth = DateUtils.getPresetRange('thisMonth');
  console.log('This Month:', thisMonth);

  // Get last month
  const lastMonth = DateUtils.getPresetRange('lastMonth');
  console.log('Last Month:', lastMonth);
}

/**
 * Example 8: Custom Date Range with Validation
 */
export function customDateRangeExample() {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');

  // Check if dates are valid
  const daysDiff = DateUtils.daysDifference(startDate, endDate);
  console.log('Days in range:', daysDiff);

  // Check if date is within range
  const checkDate = new Date('2024-01-15');
  const isWithin = DateUtils.isWithinRange(checkDate, startDate, endDate);
  console.log('Is within range:', isWithin);
}

/**
 * Example 9: Fill Missing Dates in Time Series
 */
export function fillMissingDatesExample() {
  const data = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-03', value: 150 },
    { date: '2024-01-05', value: 200 },
  ];

  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-05');

  const filledData = ChartUtils.fillMissingDates(data, startDate, endDate, 0);
  console.log('Filled Data:', filledData);
  // Output will include 2024-01-02 and 2024-01-04 with value 0
}

/**
 * Example 10: Calculate Moving Average
 */
export function movingAverageExample() {
  const data = [100, 120, 110, 130, 140, 135, 150];
  const window = 3;

  const movingAvg = ChartUtils.calculateMovingAverage(data, window);
  console.log('Moving Average:', movingAvg);
}
