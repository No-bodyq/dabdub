import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Merchant,
  MerchantStatus,
} from '../../database/entities/merchant.entity';

export interface MerchantJwtPayload {
  sub: string;
  email: string;
  role: string; // 'merchant'
}

@Injectable()
export class MerchantJwtStrategy extends PassportStrategy(
  Strategy,
  'merchant-jwt',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret',
    });
  }

  async validate(payload: MerchantJwtPayload): Promise<Merchant> {
    if (payload.role !== 'merchant') {
      throw new UnauthorizedException('Invalid token role');
    }

    const merchant = await this.merchantRepository.findOne({
      where: { id: payload.sub },
    });

    if (!merchant || merchant.status === MerchantStatus.SUSPENDED) {
      throw new UnauthorizedException('Merchant not found or suspended');
    }

    return merchant;
  }
}
