import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";
import { RiskSeverity, RiskRuleType } from "../enums";
import { RiskCondition } from "../interfaces";

@Entity("risk_rules")
@Index(["ruleType", "isEnabled"])
@Index(["createdById"])
export class RiskRule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "enum", enum: RiskRuleType })
  ruleType: RiskRuleType;

  @Column({ type: "jsonb" })
  conditions: RiskCondition;

  @Column({ type: "enum", enum: RiskSeverity })
  severity: RiskSeverity;

  @Column({ type: "boolean", default: true })
  isEnabled: boolean;

  @Column({ type: "boolean", default: false })
  autoBlock: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
