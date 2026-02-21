import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Payment } from '../src/database/entities/payment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('PublicController (e2e)', () => {
  let app: INestApplication;
  let paymentRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    paymentRepository = moduleFixture.get(getRepositoryToken(Payment));
    await app.init();
  });

  it('/api/v1/public/payment/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/public/payment/123')
      .expect(404);
  });

  it('/api/v1/public/payment/:id/qr (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/public/payment/123/qr')
      .expect(404);
  });

  it('/api/v1/public/payment/:id/status (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/public/payment/123/status')
      .expect(404);
  });

  it('/api/v1/public/payment/:id/notify (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/public/payment/123/notify')
      .send({ status: 'completed' })
      .expect(404);
  });

  it('/api/v1/public/networks (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/public/networks')
      .expect(200)
      .expect(['ethereum', 'polygon', 'bsc']);
  });

  it('/api/v1/public/exchange-rates (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/public/exchange-rates')
      .expect(200)
      .expect({
        'ETH/USD': 3000,
        'MATIC/USD': 1.5,
        'BNB/USD': 400,
      });
  });
});
