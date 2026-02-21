import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskRule, RiskAlert } from './entities';
import { RiskController } from './controllers';
import { RiskManagementService, RuleEvaluationService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([RiskRule, RiskAlert])],
  controllers: [RiskController],
  providers: [RiskManagementService, RuleEvaluationService],
  exports: [RiskManagementService, RuleEvaluationService],
})
export class RiskModule {}
