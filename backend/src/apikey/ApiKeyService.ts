import { Injectable, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { ApiKey, ApiPermission } from './entities/ApiKey';
import { Merchant } from '../merchants/entities/merchant.entity';
import { User } from '../users/entities/user.entity';
import { ApiKeyUsageLog } from './entities/ApiKeyUsageLog';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ApiKeyUsageLog)
    private readonly usageRepo: Repository<ApiKeyUsageLog>,
  ) {}

  async create(
    merchantId: string,
    dto: {
      name: string;
      permissions: ApiPermission[];
      expiresAt?: Date | null;
      mode?: 'live' | 'test';
    },
  ): Promise<string> {
    const merchant = await this.merchantRepo.findOne({ where: { userId: merchantId } });
    if (!merchant || !merchant.isVerified) {
      throw new ForbiddenException('Merchant must be verified');
    }

    const activeKeys = await this.apiKeyRepo.count({ where: { merchantId, isActive: true } });
    if (activeKeys >= 5) {
      throw new ForbiddenException('Max 5 active keys per merchant');
    }

    const prefix = dto.mode === 'test' ? 'ck_test_' : 'ck_live_';
    const rawKey = `${prefix}${nanoid(32)}`;
    const keyPrefix = rawKey.substring(0, 8);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = this.apiKeyRepo.create({
      merchantId,
      name: dto.name,
      keyPrefix,
      keyHash,
      permissions: dto.permissions,
      expiresAt: dto.expiresAt ?? null,
      isActive: true,
      lastUsedAt: null,
    });

    await this.apiKeyRepo.save(apiKey);

    return rawKey;
  }

  async list(merchantId: string): Promise<Partial<ApiKey>[]> {
    const keys = await this.apiKeyRepo.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      permissions: k.permissions,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      isActive: k.isActive,
      createdAt: k.createdAt,
    }));
  }

  async authenticate(rawKey: string): Promise<ApiKey> {
    const keyPrefix = rawKey.substring(0, 8);
    const apiKey = await this.apiKeyRepo.findOne({ where: { keyPrefix } });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    if (hash !== apiKey.keyHash || !apiKey.isActive) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new UnauthorizedException('API key expired');
    }

    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepo.save(apiKey);

    return apiKey;
  }

  async rotate(keyId: string, merchantId: string): Promise<string> {
    const apiKey = await this.apiKeyRepo.findOne({ where: { id: keyId, merchantId } });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.isActive = false;
    await this.apiKeyRepo.save(apiKey);

    const prefix = apiKey.keyPrefix.startsWith('ck_test_') ? 'ck_test_' : 'ck_live_';
    const rawKey = `${prefix}${nanoid(32)}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const newApiKey = this.apiKeyRepo.create({
      merchantId,
      name: apiKey.name,
      keyPrefix: rawKey.substring(0, 8),
      keyHash,
      permissions: apiKey.permissions,
      lastUsedAt: null,
      expiresAt: apiKey.expiresAt,
      isActive: true,
    });

    await this.apiKeyRepo.save(newApiKey);

    return rawKey;
  }

  async revoke(keyId: string, merchantId: string): Promise<void> {
    const apiKey = await this.apiKeyRepo.findOne({ where: { id: keyId, merchantId } });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.isActive = false;
    await this.apiKeyRepo.save(apiKey);
  }

  async logUsage(keyId: string, endpoint: string, ipAddress: string, responseStatus: number) {
    const log = this.usageRepo.create({
      keyId,
      endpoint,
      ipAddress,
      responseStatus,
    });
    await this.usageRepo.save(log);
  }
}
