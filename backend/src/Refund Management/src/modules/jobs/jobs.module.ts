import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { RefundProcessingProcessor } from "./processors/refund-processing.processor";
import { SettlementProcessingProcessor } from "./processors/settlement-processing.processor";
import { Refund } from "../refunds/entities/refund.entity";
import { Settlement } from "../settlements/entities/settlement.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund, Settlement]),
    BullModule.registerQueue({
      name: "refund-processing",
    }),
    BullModule.registerQueue({
      name: "settlement-processing",
    }),
  ],
  providers: [RefundProcessingProcessor, SettlementProcessingProcessor],
})
export class JobsModule {}
