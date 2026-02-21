import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { RiskModule } from './modules/risk/risk.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), RiskModule],
})
export class AppModule {}
