import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { RiskSeverity, AlertStatus, AlertActionType } from "../enums";

@Entity("risk_alerts")
@Index(["status", "severity"])
@Index(["affectedTransactionId"])
@Index(["affectedMerchantId"])
@Index(["triggeredRuleId"])
export class RiskAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: RiskSeverity })
  severity: RiskSeverity;

  @Column({ type: "varchar", length: 255 })
  type: string;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "uuid", nullable: true })
  affectedTransactionId: string;

  @Column({ type: "uuid", nullable: true })
  affectedMerchantId: string;

  @Column({ type: "uuid" })
  triggeredRuleId: string;

  @Column({ type: "enum", enum: AlertStatus, default: AlertStatus.OPEN })
  status: AlertStatus;

  @Column({ type: "enum", enum: AlertActionType, nullable: true })
  autoActionTaken: AlertActionType;

  @Column({ type: "text", nullable: true })
  resolution: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  resolvedById: string;

  @Column({ type: "timestamp", nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
