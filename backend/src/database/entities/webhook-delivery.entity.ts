import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BaseEntity,
} from 'typeorm';

export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

@Entity('webhook_deliveries')
@Index(['merchantId'])
@Index(['status'])
@Index(['event'])
@Index(['transactionId'])
@Index(['createdAt'])
@Index(['merchantId', 'status'])
@Index(['merchantId', 'createdAt'])
export class WebhookDelivery extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id', type: 'uuid' })
  @Index()
  merchantId: string;

  @Column({ name: 'endpoint_url', type: 'varchar', length: 500 })
  endpointUrl: string;

  @Column({ type: 'varchar', length: 100 })
  event: string; // 'payment.confirmed' | 'payment.settled' | etc.

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  @Index()
  transactionId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.PENDING,
  })
  status: WebhookDeliveryStatus;

  @Column({ name: 'http_status_code', type: 'int', nullable: true })
  httpStatusCode: number | null;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true })
  responseTimeMs: number | null;

  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount: number;

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to truncate response body to 2KB max
  setResponseBody(body: string | null): void {
    if (!body) {
      this.responseBody = null;
      return;
    }
    
    const maxLength = 2048; // 2KB
    this.responseBody = body.length > maxLength 
      ? body.substring(0, maxLength) + '... [truncated]'
      : body;
  }
}