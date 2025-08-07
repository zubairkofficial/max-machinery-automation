import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('lead_calls')
export class LeadCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ default: 0 })
  scheduledCallCount: number; // Track scheduled calls count

  @Column({ default: 0 })
  rescheduledCallCount: number; // Track rescheduled calls count

  @Column({ default: 0 })
  reminderCallCount: number; // Track reminder calls count

  @CreateDateColumn()
  createdAt: Date; // Track when the call record was created

  @UpdateDateColumn()
  updatedAt: Date; // Track when the call record was updated

  // Additional fields as required for the LeadCall entity
}
