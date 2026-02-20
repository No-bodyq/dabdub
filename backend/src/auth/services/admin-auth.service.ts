import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserEntity, UserRole } from '../../database/entities/user.entity';
import { AdminSessionEntity } from '../entities/admin-session.entity';
import { AdminLoginAttemptEntity } from '../entities/admin-login-attempt.entity';
import { PasswordService } from './password.service';
import { AdminLoginDto, AdminRefreshTokenDto } from '../dto/admin-auth.dto';
import { AdminJwtPayload } from '../strategies/admin-jwt.strategy';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDurationMs = 30 * 60 * 1000; // 30 minutes
  private readonly attemptWindowMs = 10 * 60 * 1000; // 10 minutes

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AdminSessionEntity)
    private readonly adminSessionRepository: Repository<AdminSessionEntity>,
    @InjectRepository(AdminLoginAttemptEntity)
    private readonly adminLoginAttemptRepository: Repository<AdminLoginAttemptEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(
    loginDto: AdminLoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<any> {
    const { email, password } = loginDto;

    // Check for account lockout
    await this.checkAccountLockout(email, ipAddress);

    // Find admin user
    const user = await this.userRepository.findOne({
      where: { 
        email, 
        isActive: true,
        role: UserRole.ADMIN || UserRole.SUPPORT_ADMIN,
      },
    });

    let loginAttempt: AdminLoginAttemptEntity;

    try {
      if (!user || ![UserRole.ADMIN, UserRole.SUPPORT_ADMIN].includes(user.role)) {
        await this.recordFailedAttempt(email, ipAddress, userAgent, 'Invalid credentials');
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await this.passwordService.comparePassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        await this.recordFailedAttempt(email, ipAddress, userAgent, 'Invalid password');
        throw new UnauthorizedException('Invalid email or password');
      }

      // Record successful attempt
      loginAttempt = this.adminLoginAttemptRepository.create({
        email,
        ipAddress: ipAddress || 'unknown',
        userAgent,
        successful: true,
      });
      await this.adminLoginAttemptRepository.save(loginAttempt);

      // Generate tokens
      const adminJwtExpiresIn = this.configService.get<string>('ADMIN_JWT_EXPIRES_IN') || '2h';
      const refreshTokenExpiresIn = '7d';

      const accessTokenPayload: AdminJwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpirationTime(adminJwtExpiresIn),
      };

      const refreshTokenPayload = {
        sub: user.id,
        type: 'admin_refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpirationTime(refreshTokenExpiresIn),
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: adminJwtExpiresIn,
      });

      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        expiresIn: refreshTokenExpiresIn,
      });

      // Create admin session
      await this.createAdminSession(user.id, refreshToken, userAgent, ipAddress);

      this.logger.log(`Admin login successful for ${email} from ${ipAddress}`);

      return {
        access_token: accessToken,
        expires_in: this.parseExpirationTime(adminJwtExpiresIn),
        admin: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Admin login error for ${email}: ${error.message}`);
      throw new BadRequestException('Login failed');
    }
  }

  async refresh(
    refreshDto: AdminRefreshTokenDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<any> {
    const { refresh_token } = refreshDto;

    try {
      const payload = this.jwtService.verify(refresh_token);
      
      if (payload.type !== 'admin_refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      const session = await this.adminSessionRepository.findOne({
        where: {
          refreshToken: refresh_token,
          isActive: true,
        },
        relations: ['user'],
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = session.user;
      if (!user.isActive || ![UserRole.ADMIN, UserRole.SUPPORT_ADMIN].includes(user.role)) {
        throw new UnauthorizedException('User not authorized');
      }

      // Generate new access token
      const adminJwtExpiresIn = this.configService.get<string>('ADMIN_JWT_EXPIRES_IN') || '2h';
      
      const accessTokenPayload: AdminJwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpirationTime(adminJwtExpiresIn),
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: adminJwtExpiresIn,
      });

      this.logger.log(`Admin token refreshed for ${user.email} from ${ipAddress}`);

      return {
        access_token: accessToken,
        expires_in: this.parseExpirationTime(adminJwtExpiresIn),
        admin: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.warn(`Admin token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.adminSessionRepository.update(
      { refreshToken, isActive: true },
      { isActive: false },
    );
    this.logger.log('Admin session logged out');
  }

  private async checkAccountLockout(email: string, ipAddress?: string): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - this.attemptWindowMs);
    
    const recentFailedAttempts = await this.adminLoginAttemptRepository.count({
      where: {
        email,
        successful: false,
        createdAt: MoreThan(tenMinutesAgo),
      },
    });

    if (recentFailedAttempts >= this.maxFailedAttempts) {
      const lastFailedAttempt = await this.adminLoginAttemptRepository.findOne({
        where: { email, successful: false },
        order: { createdAt: 'DESC' },
      });

      if (lastFailedAttempt) {
        const lockoutEndTime = new Date(lastFailedAttempt.createdAt.getTime() + this.lockoutDurationMs);
        if (new Date() < lockoutEndTime) {
          const remainingMinutes = Math.ceil((lockoutEndTime.getTime() - Date.now()) / 60000);
          
          this.logger.warn(
            `Admin account lockout triggered for ${email} from ${ipAddress}. ` +
            `${recentFailedAttempts} failed attempts in last 10 minutes.`
          );
          
          throw new ForbiddenException(
            `Account locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`
          );
        }
      }
    }
  }

  private async recordFailedAttempt(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
  ): Promise<void> {
    const attempt = this.adminLoginAttemptRepository.create({
      email,
      ipAddress: ipAddress || 'unknown',
      userAgent,
      successful: false,
      failureReason: reason,
    });
    
    await this.adminLoginAttemptRepository.save(attempt);
    
    this.logger.warn(`Failed admin login attempt for ${email} from ${ipAddress}: ${reason}`);
  }

  private async createAdminSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AdminSessionEntity> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = this.adminSessionRepository.create({
      id: `admin_session_${uuidv4()}`,
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
      isActive: true,
    });

    return this.adminSessionRepository.save(session);
  }

  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600;
    }
  }
}