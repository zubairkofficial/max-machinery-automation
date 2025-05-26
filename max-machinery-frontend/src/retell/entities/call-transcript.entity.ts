import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { CallHistory } from '../../leads/entities/call-history.entity';

@Entity('call_transcripts')
export class CallTranscript {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  callId: string;

  @Column({ type: 'text' })
  transcript: string;

  @Column({ type: 'jsonb', nullable: true })
  transcriptObject: any[];

  @Column({ type: 'jsonb', nullable: true })
  transcriptWithToolCalls: any[];

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ nullable: true })
  publicLogUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  callAnalysis: {
    call_summary?: string;
    in_voicemail?: boolean;
    user_sentiment?: string;
    call_successful?: boolean;
    custom_analysis_data?: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToOne(() => CallHistory)
  @JoinColumn({ name: 'call_history_id' })
  callHistory: CallHistory;

  @Column({ nullable: true })
  call_history_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 