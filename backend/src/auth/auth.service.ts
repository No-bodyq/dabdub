import { Injectable, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { jwtConfig } from '../config/jwt.config';
import { User } from '../users/entities/user.entity';
import { Role } from '../rbac/rbac.types';
import { RefreshToken } from './entities/refresh-token.entity';
import { Session } from './entities/session.entity';
import { CacheService } from '../cache/cache.service';
import { GeoService } from '../geo/geo.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';

export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
  sessionId: string;
  isAdmin?: boolean;
  jti?: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
    private readonly cacheService: CacheService,
    private readonly geoService: GeoService,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress?: string,
    deviceInfo?: Record<string, unknown>,
  ): Promise<TokenResponseDto> {
    const existingEmail = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      role: Role.User,
      isAdmin: false,
      isTreasury: false,
      isMerchant: false,
      isActive: true,
    } as Partial<User>);

    const savedUser = await this.userRepo.save(user);
    return this.issueTokens(
      savedUser,
      crypto.randomUUID(),
      ipAddress,
      deviceInfo,
    );
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    deviceInfo?: Record<string, unknown>,
  ): Promise<TokenResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(
      user,
      crypto.randomUUID(),
      ipAddress,
      deviceInfo,
    );
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.jwt.refreshSecret,
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload?.sessionId || !payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.tokenRepo.findOne({
      where: { sessionId: payload.sessionId, tokenHash },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    storedToken.revokedAt = new Date();
    await this.tokenRepo.save(storedToken);

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user, payload.sessionId);
  }

  async logout(sessionId: string): Promise<void> {
    const storedToken = await this.tokenRepo.findOne({
      where: { sessionId },
    });

    if (!storedToken) {
      return;
    }

    storedToken.revokedAt = new Date();
    await this.tokenRepo.save(storedToken);

    await this.cacheService.del(`session:${sessionId}`);
    const blacklistTtl = this.parseExpiry(this.jwt.accessExpiry);
    await this.cacheService.set(
      `session:blacklist:${sessionId}`,
      true,
      blacklistTtl,
    );
  }

  async issueTokens(
    user: User,
    sessionId: string,
    ipAddress?: string,
    deviceInfo?: Record<string, unknown>,
    isAdmin = false,
  ): Promise<TokenResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      sessionId,
      isAdmin,
      jti: sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwt.accessSecret,
      expiresIn: this.jwt.accessExpiry as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwt.refreshSecret,
      expiresIn: this.jwt.refreshExpiry as any,
    });

    const expiresAt = new Date(
      Date.now() + this.parseExpiry(this.jwt.refreshExpiry) * 1000,
    );

    const refreshTokenEntity = this.tokenRepo.create({
      userId: user.id,
      sessionId,
      tokenHash: this.hashToken(refreshToken),
      deviceInfo: deviceInfo ?? null,
      ipAddress: ipAddress ?? null,
      expiresAt,
      revokedAt: null,
    } as Partial<RefreshToken>);

    const savedRefreshToken = await this.tokenRepo.save(refreshTokenEntity);

    const existingSession = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (existingSession) {
      existingSession.refreshTokenId = savedRefreshToken.id;
      existingSession.deviceInfo = deviceInfo ?? null;
      existingSession.ipAddress = ipAddress ?? null;
      existingSession.country = ipAddress ? this.geoService.getCountry(ipAddress) : null;
      existingSession.lastSeenAt = new Date();
      await this.sessionRepo.save(existingSession);
    } else {
      const session = this.sessionRepo.create({
        id: sessionId,
        userId: user.id,
        refreshTokenId: savedRefreshToken.id,
        deviceInfo: deviceInfo ?? null,
        ipAddress: ipAddress ?? null,
        country: ipAddress ? this.geoService.getCountry(ipAddress) : null,
        lastSeenAt: new Date(),
      } as Partial<Session>);
      await this.sessionRepo.save(session);
    }

    await this.cacheService.trackActiveUser(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(this.jwt.accessExpiry),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(value: string): number {
    const match = /^([0-9]+)([smhdw])$/.exec(value);
    if (!match) {
      return Number(value) || 0;
    }

    const amount = Number(match[1]);
    switch (match[2]) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 3600;
      case 'd':
        return amount * 86400;
      case 'w':
        return amount * 604800;
      default:
        return amount;
    }
  }
}
