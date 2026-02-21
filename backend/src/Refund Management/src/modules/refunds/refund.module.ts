import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { RefundService } from "./services/refund.service";
import {
  RefundController,
  RefundListController,
} from "./controllers/refund.controller";
import { Refund } from "./entities/refund.entity";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund]),
    BullModule.registerQueue({
      name: "refund-processing",
    }),
    AuditModule,
  ],
  providers: [RefundService],
  controllers: [RefundController, RefundListController],
  exports: [RefundService],
})
export class RefundModule {}
