import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Admin } from '../../admin/entities/admin.entity';

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('maintenance_windows')
export class MaintenanceWindow extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'timestamp' })
  startAt!: Date;

  @Column({ type: 'timestamp' })
  endAt!: Date;

  @Column({ type: 'text', array: true })
  affectedServices!: string[];

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status!: MaintenanceStatus;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => Admin, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  creator?: Admin;
}