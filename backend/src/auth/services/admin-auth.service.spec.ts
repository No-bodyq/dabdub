import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { PasswordService } from './password.service';
import { CacheService } from '../../cache/cache.service';
import { UserEntity, UserRole } from '../../database/entities/user.entity';
import { AdminSessionEntity } from '../entities/admin-session.entity';
import { AdminLoginAttemptEntity } from '../entities/admin-login-attempt.entity';
import * as crypto from 'crypto';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let adminLoginAttemptRepository: jest.Mocked<Repository<AdminLoginAttemptEntity>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let passwordService: jest.Mocked<PasswordService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: UserEntity = {
    id: 'user_123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    isActive: true,
    isEmailVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AdminSessionEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AdminLoginAttemptEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            comparePassword: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
            hset: jest.fn(),
            hget: jest.fn(),
            hgetall: jest.fn(),
            hdel: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    adminLoginAttemptRepository = module.get(getRepositoryToken(AdminLoginAttemptEntity));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    passwordService = module.get(PasswordService);
    cacheService = module.get(CacheService);
  });

  describe('login', () => {
    const loginDto = {
      email: 'admin@example.com',
      password: 'password123',
    };

    beforeEach(() => {
      adminLoginAttemptRepository.count.mockResolvedValue(0);
      configService.get.mockReturnValue('2h');
      jwtService.sign.mockReturnValue('mock-jwt-token');
      adminLoginAttemptRepository.create.mockReturnValue({} as AdminLoginAttemptEntity);
      adminLoginAttemptRepository.save.mockResolvedValue({} as AdminLoginAttemptEntity);
      cacheService.hset.mockResolvedValue(1);
      cacheService.set.mockResolvedValue(undefined);
    });

    it('should successfully login admin user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(true);

      const result = await service.login(loginDto, 'user-agent', '127.0.0.1');

      expect(result.access_token).toEqual('mock-jwt-token');
      expect(result.expires_in).toEqual(7200);
      expect(result.admin.id).toEqual(mockUser.id);
      expect(cacheService.hset).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-admin user', async () => {
      const regularUser = { ...mockUser, role: UserRole.USER };
      userRepository.findOne.mockResolvedValue(regularUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const refreshDto = {
      refreshToken: 'valid-refresh-token',
      refresh_token: 'valid-refresh-token'
    };

    const mockPayload = {
      sub: mockUser.id,
      sessionId: 'session-123',
      type: 'admin_refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    beforeEach(() => {
      configService.get.mockReturnValue('2h');
      jwtService.sign.mockReturnValue('new-token');
    });

    it('should successfully refresh admin token (rotation)', async () => {
      const tokenHash = crypto.createHash('sha256').update(refreshDto.refreshToken).digest('hex');
      
      jwtService.verify.mockReturnValue(mockPayload);
      cacheService.get.mockResolvedValue(tokenHash); // valid hash matches
      userRepository.findOne.mockResolvedValue(mockUser);
      cacheService.hget.mockResolvedValue(JSON.stringify({ isCurrent: true }));

      const result = await service.refresh(refreshDto, 'user-agent', '127.0.0.1');

      expect(result.accessToken).toEqual('new-token');
      expect(cacheService.del).toHaveBeenCalledWith(`auth:refresh:${mockUser.id}:session-123`);
      expect(cacheService.set).toHaveBeenCalled();
      expect(cacheService.hset).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if redis token hash is missing (already used)', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      cacheService.get.mockResolvedValue(null);

      await expect(service.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if hash does not match', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      cacheService.get.mockResolvedValue('wrong-hash');

      await expect(service.refresh(refreshDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sessions & logout', () => {
    it('should retrieve sessions', async () => {
      cacheService.hgetall.mockResolvedValue({
        'session-1': JSON.stringify({ ip: '1.1.1.1' }),
        'session-2': JSON.stringify({ ip: '2.2.2.2' })
      });
      const sessions = await service.getSessions('admin-1');
      expect(sessions.length).toBe(2);
      expect(sessions[0].ip).toEqual('1.1.1.1');
    });

    it('should delete keys on logout', async () => {
      await service.logout('admin-1', 'session-1');
      expect(cacheService.del).toHaveBeenCalledWith('auth:refresh:admin-1:session-1');
      expect(cacheService.hdel).toHaveBeenCalledWith('auth:sessions:admin-1', 'session-1');
    });

    it('should delete multiple on logoutAll', async () => {
      cacheService.hgetall.mockResolvedValue({
        'session-1': '{}',
        'session-2': '{}'
      });
      await service.logoutAll('admin-1');
      expect(cacheService.delPattern).toHaveBeenCalledWith('auth:refresh:admin-1:*');
      expect(cacheService.hdel).toHaveBeenCalledWith('auth:sessions:admin-1', 'session-1');
      expect(cacheService.hdel).toHaveBeenCalledWith('auth:sessions:admin-1', 'session-2');
    });
  });
});