import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ApiKeyService } from '../services/api-key.service';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeyService: ApiKeyService) {
    super();
  }

  async validate(req: Request): Promise<UserEntity> {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    const user = await this.apiKeyService.validateApiKey(
      apiKey,
      req.ip,
      req.get('user-agent'),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid or expired API Key');
    }

    return user;
  }
}
