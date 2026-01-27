import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('settlements')
export class SettlementEntity {
  @PrimaryColumn()
  id: string;

  @Column('decimal', { precision: 19, scale: 4 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Column({ nullable: true })
  recipientEmail?: string;

  @Column({ nullable: true, length: 500 })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;
}
