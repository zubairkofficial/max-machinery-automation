
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('retell')
export class Retell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  llm_id: string;

  @Column()
  masterPrompt: string;

  @Column()
  reminderPrompt: string;
  
  @Column()
  busyPrompt: string;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 