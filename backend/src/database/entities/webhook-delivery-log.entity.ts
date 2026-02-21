import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { WebhookConfigurationEntity } from './webhook-configuration.entity';

export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('webhook_delivery_logs')
@Index(['webhookConfigId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['webhookConfigId', 'status'])
@Index(['webhookConfigId', 'createdAt'])
export class WebhookDeliveryLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'webhook_config_id', type: 'uuid' })
  webhookConfigId!: string;

  @Index()
  @Column({ name: 'merchant_id', type: 'uuid' })
  merchantId!: string;

  @Column({ name: 'payment_request_id', type: 'uuid', nullable: true })
  paymentRequestId?: string;

  @Column({ type: 'varchar', length: 100 })
  event!: string;

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({
    type: 'enum',
    enum: WebhookDeliveryStatus,
    default: WebhookDeliveryStatus.PENDING,
  })
  status!: WebhookDeliveryStatus;

  @Column({ name: 'attempt_number', type: 'int', default: 1 })
  attemptNumber!: number;

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts!: number;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true })
  responseTimeMs?: number;

  @Column({ name: 'http_status_code', type: 'int', nullable: true })
  httpStatusCode?: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'request_headers', type: 'jsonb', nullable: true })
  requestHeaders?: any;

  @Column({ name: 'request_body', type: 'text', nullable: true })
  requestBody?: string;

  @Column({ name: 'response_headers', type: 'jsonb', nullable: true })
  responseHeaders?: any;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody?: string;

  @Column({ name: 'payload_snapshot', type: 'bytea', nullable: true })
  payloadSnapshot?: Buffer;

  @Column({
    name: 'payload_snapshot_encoding',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  payloadSnapshotEncoding?: string;

  @Column({ name: 'payload_snapshot_size', type: 'int', nullable: true })
  payloadSnapshotSize?: number;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  @Column({ name: 'retention_days', type: 'int', default: 30 })
  retentionDays!: number;

  @Column({ name: 'retention_until', type: 'timestamp', nullable: true })
  retentionUntil?: Date;

  @Column({ name: 'debug_info', type: 'jsonb', nullable: true })
  debugInfo?: any;

  @Column({ name: 'request_id', type: 'varchar', length: 128, nullable: true })
  requestId?: string;

  @Column({
    name: 'correlation_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  correlationId?: string;

  @Column({ name: 'trace_id', type: 'varchar', length: 128, nullable: true })
  traceId?: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @ManyToOne(() => WebhookConfigurationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhook_config_id' })
  webhookConfiguration!: WebhookConfigurationEntity;

  @BeforeInsert()
  setRetentionUntil(): void {
    if (!this.retentionUntil) {
      const days = this.retentionDays ?? 30;
      this.retentionUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  }
}
