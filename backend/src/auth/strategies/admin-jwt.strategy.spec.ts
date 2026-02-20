import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AdminJwtStrategy, AdminJwtPayload } from './admin-jwt.strategy';
import { UserEntity, UserRole } from '../../database/entities/user.entity';

describe('AdminJwtStrategy', () => {
  let strategy: AdminJwtStrategy;
  let userRepository: jest.Mocked<Repository<UserEntity>>;

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
        AdminJwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<AdminJwtStrategy>(AdminJwtStrategy);
    userRepository = module.get(getRepositoryToken(UserEntity));
  });

  describe('validate', () => {
    const validPayload: AdminJwtPayload = {
      sub: 'user_123',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      type: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should validate admin user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(validPayload);

      expect(result).toBe(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: validPayload.sub, isActive: true },
      });
    });

    it('should validate SUPPORT_ADMIN user successfully', async () => {
      const supportAdminPayload = { ...validPayload, role: UserRole.SUPPORT_ADMIN };
      const supportAdminUser = { ...mockUser, role: UserRole.SUPPORT_ADMIN };
      
      userRepository.findOne.mockResolvedValue(supportAdminUser);

      const result = await strategy.validate(supportAdminPayload);

      expect(result).toBe(supportAdminUser);
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      const invalidPayload = { ...validPayload, type: 'regular' as any };

      await expect(strategy.validate(invalidPayload))
        .rejects.toThrow(UnauthorizedException);
      
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-admin role in payload', async () => {
      const nonAdminPayload = { ...validPayload, role: UserRole.USER };

      await expect(strategy.validate(nonAdminPayload))
        .rejects.toThrow(UnauthorizedException);
      
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for merchant role in payload', async () => {
      const merchantPayload = { ...validPayload, role: UserRole.MERCHANT };

      await expect(strategy.validate(merchantPayload))
        .rejects.toThrow(UnauthorizedException);
      
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(validPayload))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(validPayload))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user role changed to non-admin', async () => {
      const nonAdminUser = { ...mockUser, role: UserRole.USER };
      userRepository.findOne.mockResolvedValue(nonAdminUser);

      await expect(strategy.validate(validPayload))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user role changed to merchant', async () => {
      const merchantUser = { ...mockUser, role: UserRole.MERCHANT };
      userRepository.findOne.mockResolvedValue(merchantUser);

      await expect(strategy.validate(validPayload))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});