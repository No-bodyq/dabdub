import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from '../../apikey/ApiKeyService';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class ApiKeyOrJwtAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly jwtAuthGuard: JwtAuthGuard,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ck_live_') || authHeader?.startsWith('Bearer ck_test_')) {
      const rawKey = authHeader.replace('Bearer ', '').trim();
      const apiKey = await this.apiKeyService.authenticate(rawKey);

      const merchantUser = await this.userRepo.findOne({ where: { id: apiKey.merchantId } });
      if (!merchantUser || !merchantUser.isMerchant) {
        throw new UnauthorizedException('API key is not linked to a merchant user');
      }

      (req as any).user = { ...merchantUser, isMerchantApiRequest: true, apiKey };
      return true;
    }

    // Fallback to JWT guard for non-API key requests.
    return this.jwtAuthGuard.canActivate(context);
  }
}
