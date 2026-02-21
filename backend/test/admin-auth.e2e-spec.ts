import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserEntity, UserRole } from '../src/database/entities/user.entity';
import { AdminSessionEntity } from '../src/auth/entities/admin-session.entity';
import { AdminLoginAttemptEntity } from '../src/auth/entities/admin-login-attempt.entity';
import { PasswordService } from '../src/auth/services/password.service';
import { JwtService } from '@nestjs/jwt';

describe('Admin Authentication (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let adminSessionRepository: Repository<AdminSessionEntity>;
  let adminLoginAttemptRepository: Repository<AdminLoginAttemptEntity>;
  let passwordService: PasswordService;
  let jwtService: JwtService;

  const adminUser = {
    id: 'admin_123',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    isActive: true,
    isEmailVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
  };

  const supportAdminUser = {
    id: 'support_123',
    email: 'support@test.com',
    firstName: 'Support',
    lastName: 'Admin',
    password: 'hashedPassword',
    role: UserRole.SUPPORT_ADMIN,
    isActive: true,
    isEmailVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
  };

  const regularUser = {
    id: 'user_123',
    email: 'user@test.com',
    firstName: 'Regular',
    lastName: 'User',
    password: 'hashedPassword',
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    adminSessionRepository = moduleFixture.get<Repository<AdminSessionEntity>>(
      getRepositoryToken(AdminSessionEntity),
    );
    adminLoginAttemptRepository = moduleFixture.get<Repository<AdminLoginAttemptEntity>>(
      getRepositoryToken(AdminLoginAttemptEntity),
    );
    passwordService = moduleFixture.get<PasswordService>(PasswordService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Setup test data
    const hashedPassword = await passwordService.hashPassword('AdminPass123!');
    
    await userRepository.save([
      { ...adminUser, password: hashedPassword },
      { ...supportAdminUser, password: hashedPassword },
      { ...regularUser, password: hashedPassword },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await adminLoginAttemptRepository.delete({});
    await adminSessionRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  beforeEach(async () => {
    // Clean up login attempts and sessions before each test
    await adminLoginAttemptRepository.delete({});
    await adminSessionRepository.delete({});
  });

  describe('POST /admin/auth/login', () => {
    it('should successfully login admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminPass123!',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        access_token: expect.any(String),
        expires_in: expect.any(Number),
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          role: UserRole.ADMIN,
        },
        refresh_token: expect.any(String),
      });

      // Verify JWT payload
      const payload = jwtService.decode(response.body.access_token) as any;
      expect(payload.type).toBe('admin');
      expect(payload.role).toBe(UserRole.ADMIN);
    });

    it('should successfully login SUPPORT_ADMIN user', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'support@test.com',
          password: 'AdminPass123!',
        })
        .expect(201);

      expect(response.body.admin.role).toBe(UserRole.SUPPORT_ADMIN);
    });

    it('should reject regular user login', async () => {
      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'user@test.com',
          password: 'AdminPass123!',
        })
        .expect(401);
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'AdminPass123!',
        })
        .expect(401);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/admin/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'WrongPassword',
          })
          .expect(401);
      }

      // 6th attempt should be forbidden
      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminPass123!',
        })
        .expect(403);
    });

    it('should validate request body', async () => {
      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'invalid-email',
          password: 'AdminPass123!',
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'admin@test.com',
        })
        .expect(400);
    });
  });

  describe('POST /admin/auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Get a valid refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminPass123!',
        });

      validRefreshToken = loginResponse.body.refresh_token;
    });

    it('should successfully refresh admin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/auth/refresh')
        .send({
          refresh_token: validRefreshToken,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        access_token: expect.any(String),
        expires_in: expect.any(Number),
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          role: UserRole.ADMIN,
        },
      });

      // Verify new token is different
      expect(response.body.access_token).not.toBe(validRefreshToken);
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/admin/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        })
        .expect(401);
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const expiredToken = jwtService.sign(
        {
          sub: adminUser.id,
          type: 'admin_refresh',
          iat: Math.floor(Date.now() / 1000) - 3600,
          exp: Math.floor(Date.now() / 1000) - 1800,
        },
      );

      await request(app.getHttpServer())
        .post('/admin/auth/refresh')
        .send({
          refresh_token: expiredToken,
        })
        .expect(401);
    });

    it('should reject regular user refresh token', async () => {
      const regularRefreshToken = jwtService.sign({
        sub: regularUser.id,
        type: 'regular_refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      await request(app.getHttpServer())
        .post('/admin/auth/refresh')
        .send({
          refresh_token: regularRefreshToken,
        })
        .expect(401);
    });
  });

  describe('POST /admin/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/admin/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminPass123!',
        });

      accessToken = loginResponse.body.access_token;
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should successfully logout admin', async () => {
      await request(app.getHttpServer())
        .post('/admin/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refresh_token: refreshToken,
        })
        .expect(201);

      // Verify refresh token is invalidated
      await request(app.getHttpServer())
        .post('/admin/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(401);
    });

    it('should require valid admin token', async () => {
      await request(app.getHttpServer())
        .post('/admin/auth/logout')
        .send({
          refresh_token: refreshToken,
        })
        .expect(401);
    });

    it('should reject regular user token', async () => {
      const regularToken = jwtService.sign({
        sub: regularUser.id,
        email: regularUser.email,
        role: regularUser.role,
        type: 'regular',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      await request(app.getHttpServer())
        .post('/admin/auth/logout')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          refresh_token: refreshToken,
        })
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on admin auth endpoints', async () => {
      // Make 20 requests quickly
      const promises = Array.from({ length: 21 }, () =>
        request(app.getHttpServer())
          .post('/admin/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'WrongPassword',
          })
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });
});