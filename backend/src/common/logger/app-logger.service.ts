import { Injectable, LoggerService } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { getRequestContext } from '../async-storage/request-context';

@Injectable()
export class AppLogger extends Logger implements LoggerService {
  private formatMessage(message: string, context?: string): string {
    const ctx = getRequestContext();
    const prefix = ctx?.requestId ? `[${ctx.requestId}] ` : '';
    const contextPart = context ? `[${context}] ` : '';
    return `${prefix}${contextPart}${message}`;
  }

  log(message: string, context?: string): void {
    super.log(this.formatMessage(message, context), context);
  }

  error(message: string, trace?: string, context?: string): void {
    super.error(this.formatMessage(message, context), trace, context);
  }

  warn(message: string, context?: string): void {
    super.warn(this.formatMessage(message, context), context);
  }

  debug(message: string, context?: string): void {
    super.debug(this.formatMessage(message, context), context);
  }

  verbose(message: string, context?: string): void {
    super.verbose(this.formatMessage(message, context), context);
  }
}
