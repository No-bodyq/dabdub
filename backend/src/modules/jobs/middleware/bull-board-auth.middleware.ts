import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../../database/entities/user.entity';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      res.status(401).send('Unauthorized');
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string; role?: string }>(token);
      if (payload.role !== UserRole.SUPER_ADMIN) {
        res.status(403).send('Forbidden');
        return;
      }
      (req as any).user = payload;
      next();
    } catch {
      res.status(401).send('Unauthorized');
    }
  }
}
