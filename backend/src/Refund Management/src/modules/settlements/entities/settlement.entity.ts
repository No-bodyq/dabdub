import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityModel } from "../../../database/base.entity";
import { SettlementStatus } from "../../../common/enums";

@Entity("settlements")
export class Settlement extends BaseEntityModel {
  @Column({ type: "uuid" })
  merchantId: string;

  @Column({ type: "simple-array" })
  transactionIds: string[];

  @Column({ type: "decimal", precision: 20, scale: 8 })
  grossAmountUsd: string;

  @Column({ type: "decimal", precision: 20, scale: 8 })
  totalFeesUsd: string;

  @Column({ type: "decimal", precision: 20, scale: 8 })
  netAmountFiat: string;

  @Column({ type: "varchar", length: 3 })
  settlementCurrency: string;

  @Column({ type: "decimal", precision: 20, scale: 8 })
  exchangeRateUsed: string;

  @Column({
    type: "enum",
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ type: "varchar", nullable: true })
  bankTransferReference: string | null;

  @Column({ type: "varchar", nullable: true })
  liquidityProviderRef: string | null;

  @Column({ type: "text", nullable: true })
  failureReason: string | null;

  @Column({ type: "timestamptz", nullable: true })
  processingStartedAt: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  completedAt: Date | null;

  @Column({ type: "int", default: 0 })
  transactionCount: number;

  @Column({ type: "int", default: 0 })
  retryCount: number;

  @Column({ type: "text", nullable: true })
  triggerReason: string | null;
}
