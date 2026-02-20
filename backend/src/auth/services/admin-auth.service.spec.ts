import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { PasswordService } from './password.service';
import { UserEntity, UserRole } from '../../database/entities/user.entity';
import { AdminSessionEntity } from '../entities/admin-session.entity';
import { AdminLoginAttemptEntity } from '../entities/admin-login-attempt.entity';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let adminSessionRepository: jest.Mocked<Repository<AdminSessionEntity>>;
  let adminLoginAttemptRepository: jest.Mocked<Repository<AdminLoginAttemptEntity>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let passwordService: jest.Mocked<PasswordService>;

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
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
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
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    adminSessionRepository = module.get(getRepositoryToken(AdminSessionEntity));
    adminLoginAttemptRepository = module.get(getRepositoryToken(AdminLoginAttemptEntity));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    passwordService = module.get(PasswordService);
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
      adminSessionRepository.create.mockReturnValue({} as AdminSessionEntity);
      adminSessionRepository.save.mockResolvedValue({} as AdminSessionEntity);
      adminLoginAttemptRepository.create.mockReturnValue({} as AdminLoginAttemptEntity);
      adminLoginAttemptRepository.save.mockResolvedValue({} as AdminLoginAttemptEntity);
    });

    it('should successfully login admin user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(true);

      const result = await service.login(loginDto, 'user-agent', '127.0.0.1');

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        expires_in: 7200,
        admin: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        refresh_token: 'mock-jwt-token',
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-admin user', async () => {
      const regularUser = { ...mockUser, role: UserRole.USER };
      userRepository.findOne.mockResolvedValue(regularUser);

      await expect(service.login(loginDto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(false);

      await expect(service.login(loginDto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when account is locked', async () => {
      adminLoginAttemptRepository.count.mockResolvedValue(5);
      adminLoginAttemptRepository.findOne.mockResolvedValue({
        createdAt: new Date(),
      } as AdminLoginAttemptEntity);

      await expect(service.login(loginDto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPPORT_ADMIN to login', async () => {
      const supportAdmin = { ...mockUser, role: UserRole.SUPPORT_ADMIN };
      userRepository.findOne.mockResolvedValue(supportAdmin);
      passwordService.comparePassword.mockResolvedValue(true);

      const result = await service.login(loginDto, 'user-agent', '127.0.0.1');

      expect(result.admin.role).toBe(UserRole.SUPPORT_ADMIN);
    });
  });

  describe('refresh', () => {
    const refreshDto = {
      refresh_token: 'valid-refresh-token',
    };

    beforeEach(() => {
      configService.get.mockReturnValue('2h');
      jwtService.sign.mockReturnValue('new-access-token');
    });

    it('should successfully refresh admin token', async () => {
      const mockPayload = {
        sub: mockUser.id,
        type: 'admin_refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockSession = {
        refreshToken: refreshDto.refresh_token,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      } as AdminSessionEntity;

      jwtService.verify.mockReturnValue(mockPayload);
      adminSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.refresh(refreshDto, 'user-agent', '127.0.0.1');

      expect(result).toEqual({
        access_token: 'new-access-token',
        expires_in: 7200,
        admin: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      const mockPayload = {
        sub: mockUser.id,
        type: 'regular_refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jwtService.verify.mockReturnValue(mockPayload);

      await expect(service.refresh(refreshDto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      const mockPayload = {
        sub: mockUser.id,
        type: 'admin_refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const expiredSession = {
        refreshToken: refreshDto.refresh_token,
        isActive: true,
        expiresAt: new Date(Date.now() - 86400000), // Expired
        user: mockUser,
      } as AdminSessionEntity;

      jwtService.verify.mockReturnValue(mockPayload);
      adminSessionRepository.findOne.mockResolvedValue(expiredSession);

      await expect(service.refresh(refreshDto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const mockPayload = {
        sub: mockUser.id,
        type: 'admin_refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const inactiveUser = { ...mockUser, isActive: false };
      const mockSession = {
        refreshToken: refreshDto.refresh_token,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000),
        user: inactiveUser,
      } as AdminSessionEntity;

      jwtService.verify.mockReturnValue(mockPayload);
      adminSessionRepository.findOne.mockResolvedValue(mockSession);

      await expect(service.refresh(refreshDto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout admin', async () => {
      const refreshToken = 'valid-refresh-token';
      adminSessionRepository.update.mockResolvedValue({ affected: 1 } as any);

      await expect(service.logout(refreshToken)).resolves.not.toThrow();

      expect(adminSessionRepository.update).toHaveBeenCalledWith(
        { refreshToken, isActive: true },
        { isActive: false },
      );
    });
  });
});