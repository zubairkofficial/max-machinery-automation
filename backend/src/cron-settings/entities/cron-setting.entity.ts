import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { JobName } from '../enums/job-name.enum';

@Entity('cron_settings')
export class CronSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JobName, unique: true })
  jobName: JobName;

  @Column({ nullable: true })
  description: string;
  
  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  startTime: string;

  @Column({ type: 'varchar', nullable: true })
  endTime: string;

  @Column({ type: 'date', nullable: true })
  runDate: Date;

  @Column({ type: 'int', nullable: true, default: 1 })
  selectedDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 