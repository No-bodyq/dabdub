import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    attempts: number;
    resetTime: number;
  };
}

@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  use(req: Request, res: Response, next: NextFunction) {
    const endpoint = `${req.method}:${req.path}`;
    const clientIp = req.ip;
    const key = `${clientIp}:${endpoint}`;

    const now = Date.now();
    const record = this.store[key];

    if (record) {
      if (now < record.resetTime) {
        if (record.attempts >= this.maxAttempts) {
          throw new HttpException(
            `Too many login attempts. Please try again after ${Math.ceil((record.resetTime - now) / 60000)} minutes`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        record.attempts++;
      } else {
        this.store[key] = {
          attempts: 1,
          resetTime: now + this.windowMs,
        };
      }
    } else {
      this.store[key] = {
        attempts: 1,
        resetTime: now + this.windowMs,
      };
    }

    res.on('finish', () => {
      // Reset on successful login
      if (res.statusCode === 200 && req.path.includes('login')) {
        delete this.store[key];
      }
    });

    next();
  }
}
