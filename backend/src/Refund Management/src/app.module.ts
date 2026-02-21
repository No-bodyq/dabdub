import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { RefundModule } from "./modules/refunds/refund.module";
import { SettlementModule } from "./modules/settlements/settlement.module";
import { AuditModule } from "./modules/audit/audit.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { typeormConfig } from "./config/typeorm.config";
import { bullConfig } from "./config/bull.config";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormConfig),
    BullModule.forRoot(bullConfig),
    RefundModule,
    SettlementModule,
    AuditModule,
    JobsModule,
  ],
})
export class AppModule {}
