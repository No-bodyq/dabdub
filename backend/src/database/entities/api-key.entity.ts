import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserEntity } from './user.entity';

@Entity('api_keys')
export class ApiKeyEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  @Exclude()
  keyHash: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastUsedAt?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column('simple-array', { default: '' })
  allowedIps: string[];

  @Column('simple-array', { default: '' })
  permissions: string[];

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
