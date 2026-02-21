import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('admin_login_attempts')
@Index(['email', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class AdminLoginAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ default: false })
  successful: boolean;

  @Column({ nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  createdAt: Date;
}