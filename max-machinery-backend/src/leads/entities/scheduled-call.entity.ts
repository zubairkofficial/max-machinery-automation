import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';

@Entity()
export class ScheduledCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

 

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column()
  fromNumber: string;

  @Column({ nullable: true })
  overrideAgentId?: string;
  
 
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date|null;
} 