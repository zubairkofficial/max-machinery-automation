import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationToken } from './entities/verification-token.entity';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { LeadsService } from './leads.service';
import { Lead } from './entities/lead.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly twilioClient: any;
  private readonly sendgridClient: any;

  constructor(
    @InjectRepository(VerificationToken)
    private verificationTokenRepository: Repository<VerificationToken>,
    private mailService: MailService,
    private smsService: SmsService,
    @Inject(forwardRef(() => LeadsService))
    private leadsService: LeadsService,
    private readonly configService: ConfigService
  ) {
    // Initialize email and SMS clients if needed
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createVerificationToken(data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    leadId?: string;
  }): Promise<VerificationToken> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
    
    let lead: Lead = null;
    if (data.leadId) {
      lead = await this.leadsService.findOne(data.leadId);
    }

    const verificationToken = this.verificationTokenRepository.create({
      token,
      expiresAt,
      contactEmail: data.email,
      contactPhone: data.phone,
      contactFirstName: data.firstName,
      contactLastName: data.lastName,
      lead,
      leadId: data.leadId,
    });

    return this.verificationTokenRepository.save(verificationToken);
  }

  async getVerificationByToken(token: string): Promise<VerificationToken> {
    const verification = await this.verificationTokenRepository.findOne({
      where: { token, used: false },
      relations: ['lead'],
    });

    if (!verification) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date() > verification.expiresAt) {
      throw new NotFoundException('Token has expired');
    }

    return verification;
  }

  async markTokenAsUsed(id: string): Promise<void> {
    await this.verificationTokenRepository.update(id, { used: true });
  }

  async sendVerificationByEmail(verification: VerificationToken): Promise<boolean> {
    if (!verification.contactEmail) {
      return false;
    }

    await this.mailService.sendVerificationLink(
      verification.contactEmail, 
      verification.token,
      verification.contactFirstName
    );
    
    return true;
  }

  async sendVerificationBySms(verification: VerificationToken): Promise<boolean> {
    if (!verification.contactPhone) {
      return false;
    }

    return this.smsService.sendVerificationLink(
      verification.contactPhone,
      verification.token
    );
  }

  async sendVerificationLink(
    firstName: string,
    lastName: string,
    email: string | null,
    phone: string | null,
    leadId: string
  ): Promise<void> {
    try {
      const verificationLink = this.generateVerificationLink(leadId);
      const fullName = `${firstName} ${lastName}`;

      if (email) {
        await this.sendEmailVerification(email, fullName, verificationLink);
      } else if (phone) {
        await this.sendSMSVerification(phone, fullName, verificationLink);
      }
    } catch (error) {
      this.logger.error(`Failed to send verification link: ${error.message}`);
      throw error;
    }
  }

  private generateVerificationLink(leadId: string): string {
    const baseUrl = this.configService.get<string>('VERIFICATION_BASE_URL');
    const token = this.generateVerificationToken(leadId);
    return `${baseUrl}/verify/${token}`;
  }

  private generateVerificationToken(leadId: string): string {
    // In a real implementation, you would:
    // 1. Generate a secure random token
    // 2. Store it in the database with an expiration
    // 3. Associate it with the lead ID
    // For now, we'll just return a simple encoded string
    return Buffer.from(`${leadId}-${Date.now()}`).toString('base64');
  }

  private async sendEmailVerification(email: string, name: string, link: string): Promise<void> {
    try {
      // Example using SendGrid
      const emailBody = `
        Hello ${name},
        
        Thank you for your interest in Max Machinery. Please verify your contact information by clicking the link below:
        
        ${link}
        
        This link will expire in 24 hours.
        
        Best regards,
        Max Machinery Team
      `;

      // In a real implementation, you would:
      // 1. Use a proper email template
      // 2. Send through SendGrid or similar service
      // For now, we'll just log it
      this.logger.log(`Would send email to ${email}: ${emailBody}`);
    } catch (error) {
      this.logger.error(`Failed to send email verification: ${error.message}`);
      throw error;
    }
  }

  private async sendSMSVerification(phone: string, name: string, link: string): Promise<void> {
    try {
      // Example using Twilio
      const smsBody = `Hi ${name}, please verify your Max Machinery contact info: ${link}`;

      // In a real implementation, you would:
      // 1. Use Twilio or similar service to send SMS
      // For now, we'll just log it
      this.logger.log(`Would send SMS to ${phone}: ${smsBody}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS verification: ${error.message}`);
      throw error;
    }
  }
} 