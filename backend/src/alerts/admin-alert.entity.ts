import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

export enum AdminAlertType {
  REDIS_HEALTH = 'redis_health',
  STELLAR_HEALTH = 'stellar_health',
}

export enum AdminAlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
}

@Entity('admin_alerts')
@Index(['type', 'dedupeKey'], { unique: true })
export class AdminAlert extends BaseEntity {
  @Column({ type: 'enum', enum: AdminAlertType })
  type!: AdminAlertType;

  @Column({ name: 'dedupe_key', length: 128 })
  dedupeKey!: string;

  @Column({
    type: 'enum',
    enum: AdminAlertStatus,
    default: AdminAlertStatus.OPEN,
  })
  status!: AdminAlertStatus;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'occurrence_count', type: 'int', default: 1 })
  occurrenceCount!: number;

  @Column({ name: 'threshold_value', type: 'int' })
  thresholdValue!: number;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'last_notified_at', type: 'timestamptz', nullable: true })
  lastNotifiedAt!: Date | null;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt!: Date | null;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy!: string | null;
}
