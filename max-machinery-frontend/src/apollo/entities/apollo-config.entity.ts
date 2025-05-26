import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

@Entity('apollo_config')
export class ApolloConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ type: 'jsonb', nullable: true })
  jobTitles: string[];

  @Column({ type: 'jsonb', nullable: true })
  industries: string[];

  @Column({ type: 'jsonb', nullable: true })
  locations: string[];

  @Column({ nullable: true })
  companySize: string;

  @Column({ nullable: true })
  keywords: string;

  @Column({ type: 'jsonb', nullable: true })
  companyNames: string[];

  @Column({ nullable: true })
  emailStatus: string;

  @Column({ type: 'int', default: 25 })
  limit: number;

  @Column({ type: 'int', default: 1 })
  page: number;

  @Column({ default: '0 0 * * *' }) // Default: Every day at midnight
  cronSchedule: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 