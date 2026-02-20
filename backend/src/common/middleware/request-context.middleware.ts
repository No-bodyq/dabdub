import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { asyncLocalStorage } from '../async-storage/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req as any).requestId ?? '';
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const context = {
      requestId,
      adminId: (req as any).user?.sub ?? (req as any).user?.id,
      ip,
      userAgent,
    };

    asyncLocalStorage.run(context, () => next());
  }
}
