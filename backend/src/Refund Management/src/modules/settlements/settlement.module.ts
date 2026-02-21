import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { SettlementService } from "./services/settlement.service";
import { SettlementController } from "./controllers/settlement.controller";
import { Settlement } from "./entities/settlement.entity";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement]),
    BullModule.registerQueue({
      name: "settlement-processing",
    }),
    AuditModule,
  ],
  providers: [SettlementService],
  controllers: [SettlementController],
  exports: [SettlementService],
})
export class SettlementModule {}
