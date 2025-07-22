import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { Lead } from 'src/leads/entities/lead.entity';
import { MessageCategory } from 'src/message-templates/entities/message-template.entity';
import { MessageTemplatesService } from 'src/message-templates/message-templates.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private emailSentTimestamps: Map<string, number> = new Map(); // Map to track sent email timestamps

  constructor(private configService: ConfigService,private jwtService: JwtService,  private readonly messageTemplatesService: MessageTemplatesService,
 ) {
    const mailConfig = this.configService.get('mail');
    
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
    });
  }

  async sendMail({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    try {
      const mailConfig = this.configService.get('mail');
      
      // Verify transporter connection before sending
      await this.transporter.verify();
      
      const result = await this.transporter.sendMail({
        from: mailConfig.defaultFrom,
       to:to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      
      // Check for specific error types and provide more detailed logging
      if (error.code === 'EAUTH') {
        this.logger.error('Authentication failed. Please check email credentials.');
      } else if (error.code === 'ESOCKET') {
        this.logger.error('Failed to connect to email server. Please check network connection and server settings.');
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

   async sendVerificationLink(lead: Lead) {
    try {
      const currentTimestamp = Date.now();
      const lastSentTimestamp = this.emailSentTimestamps.get(lead.id);

      // Check if email was sent in the last 1 minute (60,000 ms)
      if (lastSentTimestamp && currentTimestamp - lastSentTimestamp < 60000) {
        this.logger.log(`Verification email already sent to ${lead.id}. Skipping.`);
        return; // Skip sending the email if within 1 minute
      }

      // Update the timestamp for this lead
      this.emailSentTimestamps.set(lead.id, currentTimestamp);

      const payload = { leadId: lead.id };
      const jwtSecret = this.configService.get('JWT_SECRET') || 'secret-key'; // Default to 'secret-key' if not set
     
       const token = this.jwtService.sign(payload, { secret: jwtSecret });

      const appUrl = `${this.configService.get('APP_URL')}/user-info?token=${token}` || `http://localhost:4000/api/v1/user-info?token=${token}`;

      // Get dynamic email message from templates
      const messageData = {
        firstName: lead.firstName || 'there',
        verificationUrl: appUrl,
        currentYear: new Date().getFullYear().toString(),
      };

      const emailMessage = await this.messageTemplatesService.getEmailMessage(
        MessageCategory.VERIFICATION,
        messageData
      );

      const result = await this.sendMail({
        to: lead.zohoEmail,
        subject: emailMessage.subject,
        text: emailMessage.content,
        html: emailMessage.htmlContent || emailMessage.content,
      });

      this.logger.log(`Verification email sent successfully to ${lead.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${lead.email}: ${error.message}`, error.stack);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
} 