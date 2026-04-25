/**
 * E2E: register → login → create paylink → check paylink status
 *
 * Uses mocked service layer (no real DB/Redis) so it runs in CI
 * against the test environment without external dependencies.
 */
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { PayLinkModule } from '../src/paylink/paylink.module';
import { PayLinkService } from '../src/paylink/paylink.service';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { PayLinkStatus } from '../src/paylink/entities/pay-link.entity';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user-uuid-e2e';
const MOCK_USERNAME = 'e2euser';

const MOCK_TOKENS = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 900,
};

const MOCK_PAYLINK = {
  id: 'paylink-uuid-e2e',
  creatorUserId: MOCK_USER_ID,
  tokenId: 'tok_e2e_abc123',
  amount: '25.50',
  note: 'E2E test payment',
  status: PayLinkStatus.ACTIVE,
  paidByUserId: null,
  expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  createdTxHash: 'stellar-hash-abc',
  paymentTxHash: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

// ── Auth guard mock — injects MOCK_USER_ID into req.user ─────────────────────

const mockJwtGuard = {
  canActivate: (ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    req.user = { id: MOCK_USER_ID, username: MOCK_USERNAME };
    return true;
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildApp(module: TestingModule): INestApplication<App> {
  const app = module.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  return app;
}

// ── Suite ────────────────────────────────────────────────────────────────────

describe('Auth + Payments (e2e)', () => {
  // ── Auth: register & login ─────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    let app: INestApplication<App>;
    let authService: jest.Mocked<AuthService>;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(AuthService)
        .useValue({
          register: jest.fn(),
          login: jest.fn(),
          refresh: jest.fn(),
          logout: jest.fn(),
        })
        .compile();

      app = buildApp(module);
      await app.init();
      authService = module.get(AuthService);
    });

    afterAll(() => app.close());

    it('201 — returns token pair on valid registration', async () => {
      authService.register.mockResolvedValue(MOCK_TOKENS);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'e2e@example.com', username: 'e2euser', password: 'password123' })
        .expect(201);

      expect(res.body.accessToken).toBe(MOCK_TOKENS.accessToken);
      expect(res.body.refreshToken).toBe(MOCK_TOKENS.refreshToken);
      expect(res.body.expiresIn).toBe(900);
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'e2e@example.com', username: 'e2euser' }),
        expect.any(String),
        expect.anything(),
      );
    });

    it('400 — rejects missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'e2e@example.com', username: 'e2euser' })
        .expect(400);
    });

    it('400 — rejects short password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'e2e@example.com', username: 'e2euser', password: 'short' })
        .expect(400);
    });

    it('400 — rejects invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', username: 'e2euser', password: 'password123' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let app: INestApplication<App>;
    let authService: jest.Mocked<AuthService>;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AuthModule],
      })
        .overrideProvider(AuthService)
        .useValue({ register: jest.fn(), login: jest.fn(), refresh: jest.fn(), logout: jest.fn() })
        .compile();

      app = buildApp(module);
      await app.init();
      authService = module.get(AuthService);
    });

    afterAll(() => app.close());

    it('200 — returns token pair on valid credentials', async () => {
      authService.login.mockResolvedValue(MOCK_TOKENS);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'password123' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('400 — rejects missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });
  });

  // ── Paylinks: create & check status ───────────────────────────────────────

  describe('POST /api/v1/paylinks', () => {
    let app: INestApplication<App>;
    let payLinkService: jest.Mocked<PayLinkService>;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [PayLinkModule],
      })
        .overrideProvider(PayLinkService)
        .useValue({
          create: jest.fn(),
          getPublic: jest.fn(),
          pay: jest.fn(),
          cancel: jest.fn(),
          listForCreator: jest.fn(),
        })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtGuard)
        .compile();

      app = buildApp(module);
      await app.init();
      payLinkService = module.get(PayLinkService);
    });

    afterAll(() => app.close());

    it('201 — creates a paylink and returns it', async () => {
      payLinkService.create.mockResolvedValue(MOCK_PAYLINK as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/paylinks')
        .set('Authorization', 'Bearer mock-token')
        .send({ amount: '25.50', note: 'E2E test payment' })
        .expect(201);

      expect(res.body.tokenId).toBe(MOCK_PAYLINK.tokenId);
      expect(res.body.amount).toBe('25.50');
      expect(res.body.status).toBe(PayLinkStatus.ACTIVE);
      expect(payLinkService.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: MOCK_USER_ID }),
        expect.objectContaining({ amount: '25.50' }),
      );
    });

    it('400 — rejects missing amount', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/paylinks')
        .set('Authorization', 'Bearer mock-token')
        .send({ note: 'no amount' })
        .expect(400);
    });

    it('400 — rejects invalid customSlug', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/paylinks')
        .set('Authorization', 'Bearer mock-token')
        .send({ amount: '10.00', customSlug: 'x!' }) // too short + invalid char
        .expect(400);
    });
  });

  describe('GET /api/v1/paylinks/:tokenId (public — check status)', () => {
    let app: INestApplication<App>;
    let payLinkService: jest.Mocked<PayLinkService>;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [PayLinkModule],
      })
        .overrideProvider(PayLinkService)
        .useValue({
          create: jest.fn(),
          getPublic: jest.fn(),
          pay: jest.fn(),
          cancel: jest.fn(),
          listForCreator: jest.fn(),
        })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtGuard)
        .compile();

      app = buildApp(module);
      await app.init();
      payLinkService = module.get(PayLinkService);
    });

    afterAll(() => app.close());

    it('200 — returns paylink public details', async () => {
      const publicDto = {
        tokenId: MOCK_PAYLINK.tokenId,
        amount: MOCK_PAYLINK.amount,
        note: MOCK_PAYLINK.note,
        status: PayLinkStatus.ACTIVE,
        expiresAt: MOCK_PAYLINK.expiresAt,
        creatorUsername: MOCK_USERNAME,
      };
      payLinkService.getPublic.mockResolvedValue(publicDto as any);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/paylinks/${MOCK_PAYLINK.tokenId}`)
        .expect(200);

      expect(res.body.tokenId).toBe(MOCK_PAYLINK.tokenId);
      expect(res.body.status).toBe(PayLinkStatus.ACTIVE);
      expect(res.body.amount).toBe('25.50');
    });

    it('404 — returns 404 for unknown tokenId', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      payLinkService.getPublic.mockRejectedValue(new NotFoundException('PayLink not found'));

      await request(app.getHttpServer())
        .get('/api/v1/paylinks/nonexistent-token')
        .expect(404);
    });
  });

  // ── Full flow: register → login → create paylink → check status ───────────

  describe('Full flow (register → login → create paylink → check status)', () => {
    let app: INestApplication<App>;
    let authService: jest.Mocked<AuthService>;
    let payLinkService: jest.Mocked<PayLinkService>;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AuthModule, PayLinkModule],
      })
        .overrideProvider(AuthService)
        .useValue({ register: jest.fn(), login: jest.fn(), refresh: jest.fn(), logout: jest.fn() })
        .overrideProvider(PayLinkService)
        .useValue({
          create: jest.fn(),
          getPublic: jest.fn(),
          pay: jest.fn(),
          cancel: jest.fn(),
          listForCreator: jest.fn(),
        })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtGuard)
        .compile();

      app = buildApp(module);
      await app.init();
      authService = module.get(AuthService);
      payLinkService = module.get(PayLinkService);
    });

    afterAll(() => app.close());

    it('completes the full flow end-to-end', async () => {
      // Step 1: Register
      authService.register.mockResolvedValue(MOCK_TOKENS);
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'flow@example.com', username: 'flowuser', password: 'password123' })
        .expect(201);

      expect(registerRes.body.accessToken).toBeDefined();
      const { accessToken } = registerRes.body as { accessToken: string };

      // Step 2: Login
      authService.login.mockResolvedValue(MOCK_TOKENS);
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'flow@example.com', password: 'password123' })
        .expect(200);

      expect(loginRes.body.accessToken).toBeDefined();

      // Step 3: Create paylink
      payLinkService.create.mockResolvedValue(MOCK_PAYLINK as any);
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/paylinks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: '25.50', note: 'E2E test payment' })
        .expect(201);

      expect(createRes.body.tokenId).toBeDefined();
      const { tokenId } = createRes.body as { tokenId: string };

      // Step 4: Check paylink status (public endpoint)
      payLinkService.getPublic.mockResolvedValue({
        tokenId,
        amount: '25.50',
        note: 'E2E test payment',
        status: PayLinkStatus.ACTIVE,
        expiresAt: MOCK_PAYLINK.expiresAt,
        creatorUsername: MOCK_USERNAME,
      } as any);

      const statusRes = await request(app.getHttpServer())
        .get(`/api/v1/paylinks/${tokenId}`)
        .expect(200);

      expect(statusRes.body.status).toBe(PayLinkStatus.ACTIVE);
      expect(statusRes.body.amount).toBe('25.50');
    });
  });
});
