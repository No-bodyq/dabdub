import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/ApiKey';
import { ApiKeyUsageLog } from './entities/ApiKeyUsageLog';
import { ApiKeyService } from './ApiKeyService';
import { ApiKeyController } from './apiKey.controller';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { Merchant } from '../merchants/entities/merchant.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, ApiKeyUsageLog, Merchant, User])],
  providers: [ApiKeyService, ApiKeyGuard],
  controllers: [ApiKeyController],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class ApiKeyModule {}
