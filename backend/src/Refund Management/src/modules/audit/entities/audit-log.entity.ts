import { Entity, Column } from "typeorm";
import { BaseEntityModel } from "../../../database/base.entity";
import { AuditAction } from "../../../common/enums";

@Entity("audit_logs")
export class AuditLog extends BaseEntityModel {
  @Column({ type: "enum", enum: AuditAction })
  action: AuditAction;

  @Column({ type: "uuid" })
  actorId: string;

  @Column({ type: "varchar" })
  actorRole: string;

  @Column({ type: "varchar", nullable: true })
  resourceType: string;

  @Column({ type: "uuid", nullable: true })
  resourceId: string;

  @Column({ type: "jsonb" })
  changes: Record<string, any>;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @Column({ type: "inet", nullable: true })
  ipAddress: string | null;
}
