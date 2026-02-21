import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyUsage } from './entities/api-key-usage.entity';
// Mocking Redis for now as import was missing
type Redis = any;

@Injectable()
export class ApiKeyUsageService {
  constructor(
    @InjectRepository(ApiKeyUsage) private usageRepo: Repository<ApiKeyUsage>,
    // private readonly redis: Redis
  ) {}
}
