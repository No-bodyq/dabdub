import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface AdminRateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

@Injectable()
export class AdminRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AdminRateLimitMiddleware.name);
  private store: AdminRateLimitStore = {};
  private readonly maxRequests = 20; // 20 requests per minute
  private readonly windowMs = 60 * 1000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `admin_rate_limit:${clientIp}`;

    const now = Date.now();
    const record = this.store[key];

    if (record) {
      if (now < record.resetTime) {
        if (record.requests >= this.maxRequests) {
          const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
          
          this.logger.warn(
            `Admin rate limit exceeded for IP ${clientIp}. ` +
            `${record.requests} requests in current window.`
          );
          
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: `Too many requests to admin endpoints. Please try again in ${remainingSeconds} seconds.`,
              error: 'Too Many Requests',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        record.requests++;
      } else {
        // Reset window
        this.store[key] = {
          requests: 1,
          resetTime: now + this.windowMs,
        };
      }
    } else {
      // First request from this IP
      this.store[key] = {
        requests: 1,
        resetTime: now + this.windowMs,
      };
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanupExpiredEntries();
    }

    next();
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, record] of Object.entries(this.store)) {
      if (now >= record.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => delete this.store[key]);
    
    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} expired rate limit entries`);
    }
  }
}