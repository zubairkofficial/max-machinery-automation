import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CallHistory } from './call-history.entity';
import { LastCall } from './last-call.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: 'jsonb' })
  additionalInfo: Record<string, any>;

  @Column({ default: false })
  contacted: boolean;

  @Column({ default: 'new' })
  status: string;

  @Column({ nullable: true })
  source: string;
  
  @Column({ default: 'apollo' })
  leadSource: string;

  @Column({ nullable:true })
  leadId: string;

  @Column({ nullable: true })
  machineryInterest: string;

  @Column({ nullable: true, type: 'text' })
  machineryNotes: string;

  @Column({ default: false })
  hasSurplusMachinery: boolean;

  @Column({ nullable: true, type: 'jsonb' })
  machineryDetails: {
    types?: string[];
    brands?: string[];
    condition?: string;
    age?: string;
    estimatedValue?: number;
  };

  @OneToMany(() => CallHistory, callHistory => callHistory.lead)
  callHistoryRecords: CallHistory[];

  @OneToOne(() => LastCall, lastCall => lastCall.lead)
  lastCallRecord: LastCall;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 