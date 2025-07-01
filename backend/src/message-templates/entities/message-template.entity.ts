import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MessageType {
  SMS = 'sms',
  EMAIL = 'email',
}

export enum MessageCategory {
  VERIFICATION = 'verification',
  WELCOME = 'welcome',
  REMINDER = 'reminder',
  NOTIFICATION = 'notification',
}

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: MessageType })
  type: MessageType;

  @Column({ type: 'enum', enum: MessageCategory })
  category: MessageCategory;

  @Column()
  subject: string; // For emails, can be empty for SMS

  @Column('text')
  content: string; // Message content with placeholders like {{firstName}}, {{verificationUrl}}

  @Column('text', { nullable: true })
  htmlContent: string; // HTML content for emails

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean; // Mark as default template for a category

  @Column('simple-json', { nullable: true })
  placeholders: string[]; // Array of available placeholders like ['firstName', 'verificationUrl']

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 