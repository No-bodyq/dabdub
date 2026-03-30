import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiKeyService } from '../../apikey/ApiKeyService';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing API key');
    }

    const rawKey = authHeader.replace('Bearer ', '').trim();

    const apiKey = await this.apiKeyService.authenticate(rawKey);

    const merchantUser = await this.userRepo.findOne({ where: { id: apiKey.merchantId } });
    if (!merchantUser || !merchantUser.isMerchant) {
      throw new UnauthorizedException('API key is not linked to a merchant user');
    }

    // Attach merchant user and apiKey context to request
    (req as any).user = {
      ...merchantUser,
      isMerchantApiRequest: true,
      apiKey,
    };

    const endpoint = req.originalUrl || req.url;
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

    res.on('finish', async () => {
      try {
        await this.apiKeyService.logUsage(apiKey.id, endpoint, ipAddress.toString(), res.statusCode);
      } catch {
        // don't crash request on log errors
      }
    });

    return true;
  }
}
