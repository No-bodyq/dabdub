import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';
import { GlobalConfigModule } from '../config/config.module';
import { BlockchainHealthIndicator } from './indicators/blockchain.health';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    GlobalConfigModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, BlockchainHealthIndicator],
})
export class HealthModule {}
