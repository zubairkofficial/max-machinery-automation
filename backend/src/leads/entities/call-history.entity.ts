import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Lead } from './lead.entity';
import { JobName } from 'src/cron-settings/enums/job-name.enum';

@Entity('call_history')
export class CallHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  callId: string;

  @Column()
  callType: string;
  

  @Column()
  agentId: string;

  @Column()
  status: string;

  @Column({ type: 'bigint' })
  startTimestamp: number;

  @Column({ type: 'bigint', nullable: true })
  endTimestamp: number;

  @Column({ type: 'int', nullable: true })
  duration_ms: number;

  @Column({ nullable: true })
  disconnection_reason: string;

  @Column()
  fromNumber: string;

  @Column()
  toNumber: string;

  @Column()
  direction: string;

  @Column({ type: 'jsonb', nullable: true })
  telephonyIdentifier: {
    twilio_call_sid: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  callQuality: {
    audioQuality: number;
    connectionStability: number;
    noiseLevel: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  analytics: {
    talkTime: number;
    silenceTime: number;
    leadTalkPercentage: number;
    agentTalkPercentage: number;
    interruptions: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    keyPhrases: string[];
    concerns: string[];
    interests: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  latency: {
    llm?: {
      p99: number;
      min: number;
      max: number;
      p90: number;
      num: number;
      values: number[];
      p50: number;
      p95: number;
    };
    e2e?: {
      p99: number;
      min: number;
      max: number;
      p90: number;
      num: number;
      values: number[];
      p50: number;
      p95: number;
    };
    tts?: {
      p99: number;
      min: number;
      max: number;
      p90: number;
      num: number;
      values: number[];
      p50: number;
      p95: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  callCost: {
    total_duration_unit_price: number;
    product_costs: Array<{
      unit_price: number;
      product: string;
      cost: number;
    }>;
    combined_cost: number;
    total_duration_seconds: number;
  };

  @Column({ default: false })
  opt_out_sensitive_data_storage: boolean;

  @Column({ default: false })
  opt_in_signed_url: boolean;

    @Column({
    type: 'enum',
    enum: JobName,
    default:JobName.SCHEDULED_CALLS  // Use the JobName enum to define the column type
  })
  jobType: JobName;  // New column to track job type (e.g., SCHEDULED_CALLS, RESCHEDULE_CALL, REMINDER_CALL)


  @ManyToOne(() => Lead, lead => lead.callHistoryRecords)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column()
  lead_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 