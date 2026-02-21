import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthModule } from '../src/health/health.module';
import { GlobalConfigModule } from '../src/config/config.module';
import { JwtGuard } from '../src/auth/guards/jwt.guard';
import { BlockchainHealthIndicator } from '../src/health/indicators/blockchain.health';
import { RedisHealthIndicator } from '../src/common/redis';
import { TypeOrmHealthIndicator } from '@nestjs/terminus';

// Mock dependencies to avoid actual external connections in test
jest.mock('../src/database/database.module');

// Mock Redis module to avoid real Redis connection in health e2e (jest hoists mocks)
jest.mock('../src/common/redis/redis.module', () => {
  const { Module } = require('@nestjs/common');
  const { CacheModule } = require('@nestjs/cache-manager');
  const { REDIS_CLIENT } = require('../src/common/redis/inject-redis.decorator');
  const { RedisService } = require('../src/common/redis/redis.service');
  const { RedisHealthIndicator } = require('../src/common/redis/redis.health');
  @Module({
    imports: [CacheModule.register({ isGlobal: true })],
    providers: [
      { provide: REDIS_CLIENT, useValue: { ping: () => Promise.resolve('PONG') } },
      { provide: RedisService, useValue: {} },
      {
        provide: RedisHealthIndicator,
        useValue: { isHealthy: () => Promise.resolve({ redis: { status: 'up' } }) },
      },
    ],
    exports: [REDIS_CLIENT, RedisService, RedisHealthIndicator, CacheModule],
  })
  class MockRedisModule {}
  return { RedisModule: MockRedisModule };
});

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GlobalConfigModule, HealthModule],
    })
      .overrideProvider(BlockchainHealthIndicator)
      .useValue({ isHealthy: () => ({ blockchain: { status: 'up' } }) })
      .overrideProvider(RedisHealthIndicator)
      .useValue({ isHealthy: () => ({ redis: { status: 'up' } }) })
      .overrideProvider(TypeOrmHealthIndicator)
      .useValue({ pingCheck: () => ({ database: { status: 'up' } }) })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBeDefined();
      });
  });

  it('/health/ready (GET)', () => {
    return request(app.getHttpServer()).get('/health/ready').expect(200);
  });

  it('/health/live (GET)', () => {
    return request(app.getHttpServer()).get('/health/live').expect(200);
  });

  it('/health/version (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/version')
      .expect(200)
      .expect((res) => {
        expect(res.body.version).toBeDefined();
      });
  });
});
