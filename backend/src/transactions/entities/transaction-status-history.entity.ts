import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('transaction_status_history')
@Index(['transactionId'])
export class TransactionStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'transaction_id', type: 'uuid' })
    transactionId!: string;

    @Column({ type: 'varchar', length: 100 })
    status!: string;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @CreateDateColumn({ name: 'at' })
    at!: Date;

    @ManyToOne(() => Transaction, (t) => t.statusHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_id' })
    transaction!: Transaction;
}
