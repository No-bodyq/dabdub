import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';

@Entity('merchant_audit_logs')
@Index(['merchantId'])
@Index(['createdAt'])
export class MerchantAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column()
  action: string; // e.g., 'MERCHANT_UPDATED', 'API_KEY_CREATED'

  @Column({ type: 'jsonb', nullable: true })
  changedBy: {
    id: string;
    email: string;
    role: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any>; // { field: { old: val, new: val } }

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
