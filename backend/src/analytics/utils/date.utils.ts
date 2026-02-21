/**
 * Date utility functions for analytics
 */

export class DateUtils {
  /**
   * Get the start of day for a given date
   */
  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the end of day for a given date
   */
  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get the start of week for a given date
   */
  static startOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day;
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the start of month for a given date
   */
  static startOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Subtract days from a date
   */
  static subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Get the difference in days between two dates
   */
  static daysDifference(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if a date is within a range
   */
  static isWithinRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  /**
   * Format date to ISO string without timezone
   */
  static toISODateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date range presets
   */
  static getPresetRange(
    preset:
      | 'today'
      | 'yesterday'
      | 'last7days'
      | 'last30days'
      | 'thisMonth'
      | 'lastMonth',
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    const today = this.startOfDay(now);

    switch (preset) {
      case 'today':
        return {
          startDate: today,
          endDate: this.endOfDay(now),
        };
      case 'yesterday': {
        const yesterday = this.subtractDays(today, 1);
        return {
          startDate: yesterday,
          endDate: this.endOfDay(yesterday),
        };
      }
      case 'last7days':
        return {
          startDate: this.subtractDays(today, 7),
          endDate: this.endOfDay(now),
        };
      case 'last30days':
        return {
          startDate: this.subtractDays(today, 30),
          endDate: this.endOfDay(now),
        };
      case 'thisMonth':
        return {
          startDate: this.startOfMonth(now),
          endDate: this.endOfDay(now),
        };
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: this.startOfMonth(lastMonth),
          endDate: this.endOfDay(lastMonthEnd),
        };
      }
      default:
        return {
          startDate: this.subtractDays(today, 30),
          endDate: this.endOfDay(now),
        };
    }
  }
}
