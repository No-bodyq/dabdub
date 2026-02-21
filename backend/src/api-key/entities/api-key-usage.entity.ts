import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ApiKeyUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
