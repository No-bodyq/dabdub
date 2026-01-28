import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsModule } from '../src/analytics/analytics.module';
import {
  Settlement,
  SettlementStatus,
} from '../src/settlement/entities/settlement.entity';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from '../src/database/entities/payment-request.entity';
import {
  Merchant,
  MerchantStatus,
} from '../src/database/entities/merchant.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Analytics API (e2e)', () => {
  let app: INestApplication;
  let merchantRepository: Repository<Merchant>;
  let paymentRequestRepository: Repository<PaymentRequest>;
  let settlementRepository: Repository<Settlement>;
  let testMerchantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'dabdub_test',
          entities: [Settlement, PaymentRequest, Merchant],
          synchronize: true,
          dropSchema: true,
        }),
        CacheModule.register(),
        AnalyticsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    merchantRepository = moduleFixture.get(getRepositoryToken(Merchant));
    paymentRequestRepository = moduleFixture.get(
      getRepositoryToken(PaymentRequest),
    );
    settlementRepository = moduleFixture.get(getRepositoryToken(Settlement));

    // Create test data
    await seedTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedTestData() {
    // Create test merchant
    const merchant = merchantRepository.create({
      name: 'Test Merchant',
      businessName: 'Test Business',
      email: 'test@merchant.com',
      status: MerchantStatus.ACTIVE,
    });
    const savedMerchant = await merchantRepository.save(merchant);
    testMerchantId = savedMerchant.id;

    // Create payment requests
    const now = new Date();
    const paymentRequests = [];

    for (let i = 0; i < 20; i++) {
      const pr = paymentRequestRepository.create({
        merchantId: testMerchantId,
        amount: 100 + i * 10,
        currency: 'USD',
        status:
          i < 18 ? PaymentRequestStatus.COMPLETED : PaymentRequestStatus.FAILED,
        stellarNetwork: i % 2 === 0 ? 'Polygon' : 'Base',
        customerEmail: `customer${i % 5}@example.com`,
        createdAt: new Date(now.getTime() - (20 - i) * 24 * 60 * 60 * 1000),
        completedAt:
          i < 18
            ? new Date(now.getTime() - (20 - i) * 24 * 60 * 60 * 1000 + 60000)
            : null,
      });
      paymentRequests.push(pr);
    }

    const savedPaymentRequests =
      await paymentRequestRepository.save(paymentRequests);

    // Create settlements
    for (let i = 0; i < 18; i++) {
      const settlement = settlementRepository.create({
        paymentRequestId: savedPaymentRequests[i].id,
        merchantId: testMerchantId,
        amount: savedPaymentRequests[i].amount,
        currency: 'USD',
        status: i < 17 ? SettlementStatus.COMPLETED : SettlementStatus.PENDING,
        netAmount: savedPaymentRequests[i].amount * 0.98,
        feeAmount: savedPaymentRequests[i].amount * 0.02,
        feePercentage: 2,
        createdAt: savedPaymentRequests[i].createdAt,
        settledAt:
          i < 17
            ? new Date(
                savedPaymentRequests[i].createdAt.getTime() +
                  2 * 60 * 60 * 1000,
              )
            : null,
        processedAt:
          i < 17
            ? new Date(
                savedPaymentRequests[i].createdAt.getTime() +
                  2 * 60 * 60 * 1000,
              )
            : null,
      });
      await settlementRepository.save(settlement);
    }
  }

  describe('/api/v1/analytics/dashboard (GET)', () => {
    it('should return dashboard metrics', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalTransactions');
      expect(response.body).toHaveProperty('averageTransactionValue');
      expect(response.body).toHaveProperty('successRate');
      expect(response.body).toHaveProperty('totalSettlements');
      expect(response.body).toHaveProperty('pendingSettlements');
      expect(response.body).toHaveProperty('totalFees');
      expect(response.body).toHaveProperty('activeCustomers');

      expect(response.body.totalRevenue).toHaveProperty('value');
      expect(response.body.totalRevenue).toHaveProperty('currency');
      expect(response.body.totalTransactions.value).toBeGreaterThan(0);
    });

    it('should return 400 for invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard')
        .query({
          merchantId: testMerchantId,
          startDate: 'invalid-date',
          endDate: new Date().toISOString(),
        })
        .expect(400);
    });
  });

  describe('/api/v1/analytics/revenue (GET)', () => {
    it('should return revenue data with daily interval', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/revenue')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
          interval: 'day',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('currency');
      expect(response.body).toHaveProperty('growth');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return revenue data with weekly interval', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/revenue')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
          interval: 'week',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('/api/v1/analytics/transactions/trends (GET)', () => {
    it('should return transaction trends', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/transactions/trends')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);

      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('summary');
      expect(Array.isArray(response.body.trends)).toBe(true);
      expect(response.body.summary).toHaveProperty('totalCount');
      expect(response.body.summary).toHaveProperty('totalVolume');
      expect(response.body.summary).toHaveProperty('averageSuccessRate');
    });
  });

  describe('/api/v1/analytics/settlements/statistics (GET)', () => {
    it('should return settlement statistics', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/settlements/statistics')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('failed');
      expect(response.body).toHaveProperty('successRate');
      expect(response.body).toHaveProperty('averageSettlementTime');
      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body).toHaveProperty('currency');
    });
  });

  describe('/api/v1/analytics/networks/usage (GET)', () => {
    it('should return network usage statistics', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/networks/usage')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);

      expect(response.body).toHaveProperty('networks');
      expect(response.body).toHaveProperty('mostPopular');
      expect(Array.isArray(response.body.networks)).toBe(true);

      if (response.body.networks.length > 0) {
        const network = response.body.networks[0];
        expect(network).toHaveProperty('network');
        expect(network).toHaveProperty('transactionCount');
        expect(network).toHaveProperty('volume');
        expect(network).toHaveProperty('percentage');
        expect(network).toHaveProperty('successRate');
      }
    });
  });

  describe('/api/v1/analytics/performance (GET)', () => {
    it('should return performance metrics', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/performance')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);

      expect(response.body).toHaveProperty('overallSuccessRate');
      expect(response.body).toHaveProperty('paymentSuccessRate');
      expect(response.body).toHaveProperty('settlementSuccessRate');
      expect(response.body).toHaveProperty('averageProcessingTime');
      expect(response.body).toHaveProperty('averageSettlementTime');
      expect(response.body).toHaveProperty('failedTransactions');
      expect(response.body).toHaveProperty('retrySuccessRate');
    });
  });

  describe('/api/v1/analytics/customers/insights (GET)', () => {
    it('should return customer insights', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/customers/insights')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalCustomers');
      expect(response.body).toHaveProperty('newCustomers');
      expect(response.body).toHaveProperty('returningCustomers');
      expect(response.body).toHaveProperty('averageTransactionsPerCustomer');
      expect(response.body).toHaveProperty('averageCustomerValue');
      expect(response.body).toHaveProperty('topCustomers');
      expect(Array.isArray(response.body.topCustomers)).toBe(true);
    });
  });

  describe('/api/v1/analytics/reports/generate (POST)', () => {
    it('should generate a report', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/analytics/reports/generate')
        .send({
          type: 'revenue',
          startDate: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          endDate: new Date().toISOString(),
          format: 'csv',
          merchantId: testMerchantId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('reportId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('estimatedCompletion');
      expect(response.body.status).toBe('pending');
    });

    it('should validate report generation request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/analytics/reports/generate')
        .send({
          type: 'invalid-type',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(400);
    });
  });

  describe('Performance Tests', () => {
    it('dashboard should load within 2 seconds', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    it('should benefit from caching on repeated requests', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const endDate = new Date().toISOString();

      // First request
      const firstStart = Date.now();
      await request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);
      const firstDuration = Date.now() - firstStart;

      // Second request (should be cached)
      const secondStart = Date.now();
      await request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard')
        .query({
          merchantId: testMerchantId,
          startDate,
          endDate,
        })
        .expect(200);
      const secondDuration = Date.now() - secondStart;

      // Cached request should be faster
      expect(secondDuration).toBeLessThanOrEqual(firstDuration);
    });
  });
});
