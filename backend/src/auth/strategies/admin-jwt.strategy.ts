import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../../database/entities/user.entity';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  type: 'admin';
  sessionId: string;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AdminJwtPayload): Promise<UserEntity> {
    // Verify this is an admin token
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Verify the role is admin-level
    const adminRoles = [UserRole.ADMIN, UserRole.SUPPORT_ADMIN];
    if (!adminRoles.includes(payload.role)) {
      throw new UnauthorizedException('Admin role required');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Double-check the user's role in the database
    if (!adminRoles.includes(user.role)) {
      throw new UnauthorizedException('Admin role required');
    }

    (user as any).sessionId = payload.sessionId;
    return user;
  }
}