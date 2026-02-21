import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ErrorCode } from '../errors/error-codes.enum';

/**
 * Error Statistics Interface
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByStatus: Record<number, number>;
  recentErrors: ErrorLog[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Error Log Interface
 */
export interface ErrorLog {
  errorCode: string;
  statusCode: number;
  message: string;
  timestamp: Date;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Error Monitoring Service
 * Provides error tracking and statistics
 */
@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name);
  private errorLogs: ErrorLog[] = [];
  private readonly MAX_LOG_SIZE = 1000; // Keep last 1000 errors in memory

  /**
   * Log an error
   */
  logError(error: ErrorLog): void {
    // Add to in-memory log
    this.errorLogs.push(error);

    // Keep only the last MAX_LOG_SIZE errors
    if (this.errorLogs.length > this.MAX_LOG_SIZE) {
      this.errorLogs = this.errorLogs.slice(-this.MAX_LOG_SIZE);
    }

    // Send to Sentry if it's a server error
    if (error.statusCode >= 500) {
      Sentry.captureMessage(error.message, {
        level: 'error',
        tags: {
          errorCode: error.errorCode,
          statusCode: error.statusCode.toString(),
          requestId: error.requestId,
        },
        extra: error.metadata,
      });
    }
  }

  /**
   * Get error statistics
   */
  getStatistics(timeRangeHours = 24): ErrorStatistics {
    const end = new Date();
    const start = new Date(end.getTime() - timeRangeHours * 60 * 60 * 1000);

    const filteredErrors = this.errorLogs.filter(
      (error) => error.timestamp >= start && error.timestamp <= end,
    );

    const errorsByCode: Record<string, number> = {};
    const errorsByStatus: Record<number, number> = {};

    for (const error of filteredErrors) {
      errorsByCode[error.errorCode] = (errorsByCode[error.errorCode] || 0) + 1;
      errorsByStatus[error.statusCode] =
        (errorsByStatus[error.statusCode] || 0) + 1;
    }

    return {
      totalErrors: filteredErrors.length,
      errorsByCode,
      errorsByStatus,
      recentErrors: filteredErrors.slice(-50), // Last 50 errors
      timeRange: { start, end },
    };
  }

  /**
   * Get errors by error code
   */
  getErrorsByCode(errorCode: ErrorCode, limit = 10): ErrorLog[] {
    return this.errorLogs
      .filter((error) => error.errorCode === errorCode)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear error logs
   */
  clearLogs(): void {
    this.errorLogs = [];
    this.logger.log('Error logs cleared');
  }
}
