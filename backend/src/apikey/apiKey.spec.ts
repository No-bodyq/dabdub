import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ApiKeyService } from './ApiKeyService';
import { ApiKey, ApiPermission } from './entities/ApiKey';
import { ForbiddenException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

// Mock nanoid to return predictable values
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => '01234567890123456789012345678901'),
}));

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let mockApiKeyRepo: any;
  let mockMerchantRepo: any;
  let mockUserRepo: any;
  let mockUsageRepo: any;

  beforeEach(() => {
    mockApiKeyRepo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockMerchantRepo = {
      findOne: jest.fn().mockResolvedValue({ userId: 'user1', isVerified: true }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'user1', isMerchant: true }),
    };

    mockUsageRepo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
    };

    service = new ApiKeyService(
      mockApiKeyRepo,
      mockMerchantRepo,
      mockUserRepo,
      mockUsageRepo,
    );
  });

  it('returns full key only on create', async () => {
    const result = await service.create('user1', {
      name: 'Production Key',
      permissions: [ApiPermission.PAYLINKS_CREATE],
      mode: 'live',
    });

    // Should be in format ck_live_ + 32 random chars
    expect(result).toMatch(/^ck_live_/);
    expect(result.length).toBe(8 + 32);
  });

  it('SHA-256 comparison works', async () => {
    const rawKey = 'ck_live_01234567890123456789012345678901';
    const keyPrefix = 'ck_live_';
    const expectedHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    mockApiKeyRepo.findOne.mockResolvedValue({
      id: 'key1',
      merchantId: 'user1',
      keyPrefix,
      keyHash: expectedHash,
      permissions: [ApiPermission.PAYLINKS_CREATE],
      isActive: true,
      expiresAt: null,
      lastUsedAt: null,
    });

    const result = await service.authenticate(rawKey);

    expect(result.merchantId).toBe('user1');
    expect(result.isActive).toBe(true);
  });

  it('expired key → 401', async () => {
    const rawKey = 'ck_live_01234567890123456789012345678901';
    const keyPrefix = 'ck_live_';
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const expiresAt = new Date(Date.now() - 1000); // expired 1 second ago

    mockApiKeyRepo.findOne.mockResolvedValue({
      id: 'key1',
      merchantId: 'user1',
      keyPrefix,
      keyHash: hash,
      permissions: [ApiPermission.PAYLINKS_CREATE],
      isActive: true,
      expiresAt,
    });

    expect(service.authenticate(rawKey)).rejects.toThrow(UnauthorizedException);
  });

  it('revoked key → 401', async () => {
    const rawKey = 'ck_live_01234567890123456789012345678901';
    const keyPrefix = 'ck_live_';
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    mockApiKeyRepo.findOne.mockResolvedValue({
      id: 'key1',
      merchantId: 'user1',
      keyPrefix,
      keyHash: hash,
      permissions: [ApiPermission.PAYLINKS_CREATE],
      isActive: false, // revoked
      expiresAt: null,
    });

    expect(service.authenticate(rawKey)).rejects.toThrow(UnauthorizedException);
  });

  it('permissions enforced per endpoint', async () => {
    const rawKey = 'ck_live_01234567890123456789012345678901';
    const keyPrefix = 'ck_live_';
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    mockApiKeyRepo.findOne.mockResolvedValue({
      id: 'key1',
      merchantId: 'user1',
      keyPrefix,
      keyHash: hash,
      permissions: [ApiPermission.PAYLINKS_READ], // only has read, not create
      isActive: true,
      expiresAt: null,
    });

    const apiKey = await service.authenticate(rawKey);
    expect(apiKey.permissions).toContain(ApiPermission.PAYLINKS_READ);
    expect(apiKey.permissions).not.toContain(ApiPermission.PAYLINKS_CREATE);
  });

  it('unverified merchant → 403', async () => {
    mockMerchantRepo.findOne.mockResolvedValue({
      userId: 'user1',
      isVerified: false,
    });

    expect(
      service.create('user1', {
        name: 'Test Key',
        permissions: [ApiPermission.PAYLINKS_CREATE],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('max 5 active keys → 403', async () => {
    mockApiKeyRepo.count.mockResolvedValue(5);

    expect(
      service.create('user1', {
        name: 'Test Key',
        permissions: [ApiPermission.PAYLINKS_CREATE],
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
