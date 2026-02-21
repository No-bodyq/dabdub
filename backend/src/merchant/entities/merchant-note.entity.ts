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

@Entity('merchant_notes')
@Index(['merchantId'])
@Index(['createdAt'])
export class MerchantNote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'merchant_id' })
    merchantId: string;

    @ManyToOne(() => Merchant, (merchant) => merchant.notes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_id' })
    merchant: Merchant;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'jsonb', nullable: true })
    createdBy: {
        id: string;
        email: string;
        role?: string;
    };

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
