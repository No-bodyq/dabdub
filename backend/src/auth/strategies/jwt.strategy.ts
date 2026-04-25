import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { jwtConfig } from '../../config/jwt.config';
import { User } from '../../users/entities/user.entity';
import { Admin } from '../../admin/entities/admin.entity';
import { CacheService } from '../../cache/cache.service';
import type { JwtPayload } from '../auth.service';

interface ExtendedJwtPayload extends JwtPayload {
  isAdmin?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    jwt: ConfigType<typeof jwtConfig>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.accessSecret,
    });
  }

  async validate(payload: ExtendedJwtPayload): Promise<User | Admin> {
    const sessionIdentifier = payload.jti ?? payload.sessionId;
    if (!sessionIdentifier) {
      throw new Error('Unauthorized');
    }

    const blacklistKey = `session:blacklist:${sessionIdentifier}`;
    const isBlacklisted = await this.cacheService.get<boolean>(blacklistKey);
    if (isBlacklisted) {
      throw new Error('Unauthorized');
    }

    const cacheKey = `session:${sessionIdentifier}`;
    const cached = await this.cacheService.get<User | Admin>(cacheKey);
    if (cached) {
      return cached;
    }

    if (payload.isAdmin) {
      const admin = await this.adminRepo.findOne({
        where: { id: payload.sub },
      });
      if (!admin) {
        throw new Error('Unauthorized');
      }

      const ttl = payload.exp
        ? Math.max(Math.floor(payload.exp - Date.now() / 1000), 0)
        : 0;
      if (ttl > 0) {
        await this.cacheService.set(cacheKey, admin, ttl);
      }
      return admin;
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new Error('Unauthorized');
    }

    const ttl = payload.exp
      ? Math.max(Math.floor(payload.exp - Date.now() / 1000), 0)
      : 0;
    if (ttl > 0) {
      await this.cacheService.set(cacheKey, user, ttl);
    }

    return user;
  }
}
