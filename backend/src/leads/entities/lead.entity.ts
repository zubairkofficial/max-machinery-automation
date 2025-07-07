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
import { UserInfo } from 'src/userInfo/entities/user-info.entity';

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

  @Column({ nullable: true })
  zohoPhoneNumber: string;

  @Column({ nullable: true })
  zohoEmail: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledCallbackDate: Date;
  
  @OneToMany(() => CallHistory, callHistory => callHistory.lead)
  callHistoryRecords: CallHistory[];

   @OneToOne(() => LastCall, lastCall => lastCall.lead, {
    cascade: true, // ✅ Optional: auto-save related entities
    eager: true    // ✅ Load automatically with lead
  })
  lastCallRecord: LastCall;

 @OneToOne(() => UserInfo, userInfo => userInfo.lead, { onDelete: 'CASCADE', })
userInfo: UserInfo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  formSubmitted: boolean;

  @Column({ default: false })
  linkClicked: boolean;
  
  @Column({ default: false })
  linkSend: boolean;

 @Column({ type: 'timestamp', nullable: true })
  reminder: Date;

  @Column({ type: 'timestamp', nullable: true })
  formSubmittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  linkClickedAt: Date;
} 