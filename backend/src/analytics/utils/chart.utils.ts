/**
 * Utility functions for converting analytics data to chart-ready formats
 */

export class ChartUtils {
  /**
   * Convert time-series data to Chart.js format
   */
  static toChartJsFormat(data: Array<{ date: string; value: number }>, label: string = 'Data') {
    return {
      labels: data.map(d => d.date),
      datasets: [
        {
          label,
          data: data.map(d => d.value),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  }

  /**
   * Convert multiple series to Chart.js format
   */
  static toMultiSeriesChartJs(
    data: Array<{ date: string; [key: string]: any }>,
    series: Array<{ key: string; label: string; color?: string }>,
  ) {
    const labels = data.map(d => d.date);
    const datasets = series.map((s, index) => ({
      label: s.label,
      data: data.map(d => d[s.key]),
      borderColor: s.color || this.getDefaultColor(index),
      backgroundColor: this.getDefaultBackgroundColor(index),
      tension: 0.1,
    }));

    return { labels, datasets };
  }

  /**
   * Convert data to pie chart format
   */
  static toPieChartFormat(data: Array<{ label: string; value: number }>) {
    return {
      labels: data.map(d => d.label),
      datasets: [
        {
          data: data.map(d => d.value),
          backgroundColor: data.map((_, i) => this.getDefaultColor(i)),
        },
      ],
    };
  }

  /**
   * Convert data to bar chart format
   */
  static toBarChartFormat(data: Array<{ label: string; value: number }>, label: string = 'Data') {
    return {
      labels: data.map(d => d.label),
      datasets: [
        {
          label,
          data: data.map(d => d.value),
          backgroundColor: data.map((_, i) => this.getDefaultBackgroundColor(i)),
          borderColor: data.map((_, i) => this.getDefaultColor(i)),
          borderWidth: 1,
        },
      ],
    };
  }

  /**
   * Get default color for chart series
   */
  private static getDefaultColor(index: number): string {
    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
    ];
    return colors[index % colors.length];
  }

  /**
   * Get default background color for chart series
   */
  private static getDefaultBackgroundColor(index: number): string {
    const colors = [
      'rgba(75, 192, 192, 0.2)',
      'rgba(255, 99, 132, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(255, 206, 86, 0.2)',
      'rgba(153, 102, 255, 0.2)',
      'rgba(255, 159, 64, 0.2)',
    ];
    return colors[index % colors.length];
  }

  /**
   * Fill missing dates in time series data
   */
  static fillMissingDates(
    data: Array<{ date: string; value: number }>,
    startDate: Date,
    endDate: Date,
    defaultValue: number = 0,
  ): Array<{ date: string; value: number }> {
    const result: Array<{ date: string; value: number }> = [];
    const dataMap = new Map(data.map(d => [d.date, d.value]));

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: dataMap.get(dateStr) || defaultValue,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Calculate moving average
   */
  static calculateMovingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const subset = data.slice(start, i + 1);
      const avg = subset.reduce((sum, val) => sum + val, 0) / subset.length;
      result.push(avg);
    }
    return result;
  }
}
