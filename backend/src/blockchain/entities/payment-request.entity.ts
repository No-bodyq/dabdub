import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PaymentRequestStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('payment_requests')
export class PaymentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id', type: 'uuid' })
  @Index()
  merchantId: string;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ name: 'network_id' })
  @Index()
  networkId: string;

  @Column({ name: 'recipient_address' })
  @Index()
  recipientAddress: string;

  @Column({ name: 'payment_reference', unique: true })
  @Index()
  paymentReference: string;

  @Column({
    type: 'enum',
    enum: PaymentRequestStatus,
    default: PaymentRequestStatus.PENDING,
  })
  status: PaymentRequestStatus;

  @Column({ name: 'tx_hash', nullable: true })
  txHash: string;

  @Column({ name: 'block_number', type: 'bigint', nullable: true })
  blockNumber: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
