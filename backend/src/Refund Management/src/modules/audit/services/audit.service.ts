import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../entities/audit-log.entity";
import { AuditAction } from "../../../common/enums";

export interface AuditLogPayload {
  action: AuditAction;
  actorId: string;
  actorRole: string;
  resourceType?: string;
  resourceId?: string;
  changes: Record<string, any>;
  reason?: string;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(payload: AuditLogPayload): Promise<AuditLog> {
    const auditLog = this.auditRepository.create({
      action: payload.action,
      actorId: payload.actorId,
      actorRole: payload.actorRole,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      changes: payload.changes,
      reason: payload.reason || null,
      ipAddress: payload.ipAddress || null,
    });

    return this.auditRepository.save(auditLog);
  }

  async getAuditTrail(
    resourceType: string,
    resourceId: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: {
        resourceType,
        resourceId,
      },
      order: {
        createdAt: "DESC",
      },
      take: limit,
    });
  }
}
