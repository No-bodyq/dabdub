import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('blockchain_block_cursors')
export class BlockchainBlockCursor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'network_id', unique: true })
  @Index()
  networkId: string;

  @Column({ name: 'last_processed_block', type: 'bigint' })
  lastProcessedBlock: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
