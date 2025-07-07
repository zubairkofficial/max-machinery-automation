import { Lead } from 'src/leads/entities/lead.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_info')
export class UserInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable:true})
  firstName: string;

  @Column({nullable:true})
  lastName: string;

  @Column({nullable:true})
  email: string;

  @Column({nullable:true})
  phone: string;

  @Column({ type: 'text', nullable: true })
  additionalDetails: string;

  @Column({ default: false })
  contacted: boolean;

  @Column({ name: 'lead_id' })
  leadId: string;

 @OneToOne(() => Lead, lead => lead.userInfo, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'lead_id' })
lead: Lead;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
