import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('MerchantController (e2e)', () => {
  let app: INestApplication;
  let authHeader: { Authorization: string };

  // Unique data for this test run
  const uniqueId = Date.now();
  const merchantData = {
    name: `Test Merchant ${uniqueId}`,
    email: `merchant${uniqueId}@example.com`,
    password: 'password123', // meets min length 8
    businessName: `Business ${uniqueId}`,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/merchants/register (POST)', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/merchants/register')
      .send(merchantData)
      .expect(201)
      .then((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toEqual(merchantData.email);
        expect(res.body.password).toBeUndefined();
      });
  });

  it('/api/v1/merchants/login (POST)', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/merchants/login')
      .send({
        email: merchantData.email,
        password: merchantData.password,
      })
      .expect(200)
      .then((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        authHeader = { Authorization: `Bearer ${res.body.accessToken}` };
      });
  });

  it('/api/v1/merchants/profile (GET)', async () => {
    return request(app.getHttpServer())
      .get('/api/v1/merchants/profile')
      .set(authHeader)
      .expect(200)
      .then((res) => {
        expect(res.body.email).toEqual(merchantData.email);
        expect(res.body.name).toEqual(merchantData.name);
      });
  });

  it('/api/v1/merchants/profile (PUT)', async () => {
    const updateData = { name: 'Updated Merchant Name' };
    return request(app.getHttpServer())
      .put('/api/v1/merchants/profile')
      .set(authHeader)
      .send(updateData)
      .expect(200)
      .then((res) => {
        expect(res.body.name).toEqual(updateData.name);
      });
  });

  it('/api/v1/merchants/settings (PUT)', async () => {
    const settingsData = { emailNotifications: true, currency: 'EUR' };
    return request(app.getHttpServer())
      .put('/api/v1/merchants/settings')
      .set(authHeader)
      .send(settingsData)
      .expect(200)
      .then((res) => {
        expect(res.body.settings.currency).toEqual('EUR');
      });
  });

  it('/api/v1/merchants/statistics (GET)', async () => {
    return request(app.getHttpServer())
      .get('/api/v1/merchants/statistics')
      .set(authHeader)
      .expect(200)
      .then((res) => {
        expect(res.body.totalVolume).toBeDefined();
      });
  });

  it('/api/v1/merchants/refresh-token (POST)', async () => {
    // First get refresh token from login again
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/merchants/login')
      .send({
        email: merchantData.email,
        password: merchantData.password,
      });

    const refreshToken = loginRes.body.refreshToken;

    return request(app.getHttpServer())
      .post('/api/v1/merchants/refresh-token')
      .send({ refreshToken })
      .expect(201) // or 200, check controller
      .then((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
      });
  });
});
