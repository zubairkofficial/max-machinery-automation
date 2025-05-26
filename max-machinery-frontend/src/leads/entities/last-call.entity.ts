import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Lead } from './lead.entity';

@Entity('last_calls')
export class LastCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  callId: string;

  @Column()
  status: string;

  @Column({ type: 'bigint' })
  timestamp: number;

  @OneToOne(() => Lead, lead => lead.lastCallRecord)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column()
  lead_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 