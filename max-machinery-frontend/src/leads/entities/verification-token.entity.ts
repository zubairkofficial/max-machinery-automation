import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Lead } from './lead.entity';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({ default: false })
  used: boolean;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactFirstName: string;

  @Column({ nullable: true })
  contactLastName: string;

  @OneToOne(() => Lead, { nullable: true })
  @JoinColumn()
  lead: Lead;

  @Column({ nullable: true })
  leadId: string;

  @CreateDateColumn()
  createdAt: Date;
} 