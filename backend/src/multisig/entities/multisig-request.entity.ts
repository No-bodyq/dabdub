import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MultisigRequestType {
  LARGE_WITHDRAWAL = 'large_withdrawal',
  ADMIN_OPERATION = 'admin_operation',
}

export enum MultisigRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface MultisigApproval {
  adminId: string;
  signedAt: Date;
  signatureXdr: string;
}

@Entity('multisig_requests')
@Index(['status', 'expiresAt'])
@Index(['requestedBy', 'createdAt'])
export class MultisigRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MultisigRequestType })
  type!: MultisigRequestType;

  @Column({ name: 'tx_xdr', type: 'text' })
  txXdr!: string;

  @Column({ type: 'varchar', length: 50 })
  threshold!: string;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy!: string;

  @Column({
    type: 'enum',
    enum: MultisigRequestStatus,
    default: MultisigRequestStatus.PENDING,
  })
  status!: MultisigRequestStatus;

  @Column({ type: 'jsonb', default: [] })
  approvals!: MultisigApproval[];

  @Column({ name: 'required_signatures', default: 2 })
  requiredSignatures!: number;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'tx_hash', type: 'varchar', length: 64, nullable: true })
  txHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
