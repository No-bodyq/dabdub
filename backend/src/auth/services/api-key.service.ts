import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyEntity } from '../../database/entities/api-key.entity';
import { UserEntity } from '../../database/entities/user.entity';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createApiKey(
    userId: string,
    name: string,
    permissions: string[] = [],
    expiresAt?: Date,
  ): Promise<{ id: string; key: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rawKey = `${name}_${uuidv4()}_${crypto.randomBytes(16).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = this.apiKeyRepository.create({
      id: `ak_${uuidv4()}`,
      keyHash,
      name,
      userId,
      permissions,
      expiresAt,
      isActive: true,
      allowedIps: [],
    });

    await this.apiKeyRepository.save(apiKey);

    return {
      id: apiKey.id,
      key: rawKey,
    };
  }

  async validateApiKey(
    rawKey: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserEntity | null> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.apiKeyRepository.findOne({
      where: {
        keyHash,
        isActive: true,
      },
      relations: ['user'],
    });

    if (!apiKey) {
      return null;
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.isActive = false;
      await this.apiKeyRepository.save(apiKey);
      return null;
    }

    // Check IP whitelist
    if (
      ipAddress &&
      apiKey.allowedIps.length > 0 &&
      !apiKey.allowedIps.includes(ipAddress)
    ) {
      throw new UnauthorizedException(
        'IP address not whitelisted for this API key',
      );
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepository.save(apiKey);

    return apiKey.user;
  }

  async revokeApiKey(apiKeyId: string, userId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  async getUserApiKeys(userId: string): Promise<ApiKeyEntity[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateApiKeyPermissions(
    apiKeyId: string,
    userId: string,
    permissions: string[],
  ): Promise<ApiKeyEntity> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.permissions = permissions;
    return this.apiKeyRepository.save(apiKey);
  }
}
