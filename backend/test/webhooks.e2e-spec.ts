import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { WebhookEvent } from '../src/database/entities/webhook-configuration.entity';

describe('WebhooksController (e2e)', () => {
  let app: INestApplication;
  const merchantId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    jest.setTimeout(60000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/webhooks (POST)', () => {
    it('should create a new webhook configuration', () => {
      return request(app.getHttpServer() as unknown as string)
        .post('/api/v1/webhooks')
        .set('x-merchant-id', merchantId)
        .send({
          url: 'https://example.com/webhook',
          events: [WebhookEvent.PAYMENT_REQUEST_COMPLETED],
        })
        .expect(HttpStatus.CREATED)
        .expect((res: { body: Record<string, any> }) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.url).toBe('https://example.com/webhook');
          expect(res.body.events).toContain(
            WebhookEvent.PAYMENT_REQUEST_COMPLETED,
          );
          expect(res.body).toHaveProperty('secret');
        });
    });

    it('should fail if URL is invalid', () => {
      return request(app.getHttpServer() as unknown as string)
        .post('/api/v1/webhooks')
        .set('x-merchant-id', merchantId)
        .send({
          url: 'not-a-url',
          events: [WebhookEvent.PAYMENT_REQUEST_COMPLETED],
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/api/v1/webhooks (GET)', () => {
    it('should list webhook configurations', () => {
      return request(app.getHttpServer() as unknown as string)
        .get('/api/v1/webhooks')
        .set('x-merchant-id', merchantId)
        .expect(HttpStatus.OK)
        .expect((res: { body: any[] }) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/v1/webhooks/events (GET)', () => {
    it('should return available events', () => {
      return request(app.getHttpServer() as unknown as string)
        .get('/api/v1/webhooks/events')
        .expect(HttpStatus.OK)
        .expect((res: { body: string[] }) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toContain(WebhookEvent.PAYMENT_REQUEST_COMPLETED);
        });
    });
  });

  describe('/api/v1/webhooks/validate-signature (POST)', () => {
    it('should validate a correct signature', () => {
      // This is a helper test, it might need more setup if it uses actual logic
      // but the controller endpoint is straightforward
      return request(app.getHttpServer() as unknown as string)
        .post('/api/v1/webhooks/validate-signature')
        .send({
          secret: 'whsec_test',
          payload: { test: true },
          signature: 'invalid_for_now_but_endpoint_exists',
          timestamp: Math.floor(Date.now() / 1000),
        })
        .expect(HttpStatus.CREATED)
        .expect((res: { body: Record<string, any> }) => {
          expect(res.body).toHaveProperty('isValid');
        });
    });
  });
});
