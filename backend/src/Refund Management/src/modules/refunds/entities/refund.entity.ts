import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntityModel } from '../../../database/base.entity';
import { RefundMethod, RefundStatus, RefundReason } from '../../../common/enums';

@Entity('refunds')
export class Refund extends BaseEntityModel {
  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'uuid' })
  initiatedById: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  refundAmountUsd: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  refundAmountToken: string | null;

  @Column({ type: 'enum', enum: RefundMethod })
  method: RefundMethod;

  @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.INITIATED })
  status: RefundStatus;

  @Column({ type: 'enum', enum: RefundReason })
  reason: RefundReason;

  @Column({ type: 'text' })
  internalNote: string;

  @Column({ type: 'varchar', nullable: true })
  onChainTxHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ type: 'int', default: 0 })
  retryCount: number;
}
