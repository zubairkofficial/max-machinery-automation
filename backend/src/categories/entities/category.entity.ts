import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  // @Column({ nullable: true })
  // description: string;

  // @Column({ nullable: true })
  // color: string; // For UI color coding

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Lead, lead => lead.category)
  leads: Lead[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}