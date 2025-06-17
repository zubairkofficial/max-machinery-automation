import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Lead } from '../leads/entities/lead.entity';
import type { MessageBird } from 'messagebird/types';
import { MessageCategory } from 'src/message-templates/entities/message-template.entity';
import { MessageTemplatesService } from 'src/message-templates/message-templates.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly messageBirdClient: MessageBird;
  private readonly fromNumber: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly messageTemplatesService: MessageTemplatesService,
 
  ) {
    const apiKey = this.configService.get<string>('MESSAGEBIRD_API_KEY');
    this.fromNumber = this.configService.get<string>('MESSAGEBIRD_ORIGINATOR') || 'MachineryMax';

    if (apiKey) {
      // Using require for MessageBird initialization
      const messagebirdInit = require('messagebird');
      this.messageBirdClient = messagebirdInit(apiKey);
    } else {
      this.logger.warn('MessageBird API key not found. SMS service will be disabled.');
    }
  }

  async sendSms(to: string, body: string): Promise<boolean> {
    if (!this.messageBirdClient) {
      this.logger.warn('MessageBird client not initialized');
      return false;
    }

    try {
      await new Promise((resolve, reject) => {
        this.messageBirdClient.messages.create({
          originator: this.fromNumber,
          recipients: [to],
          body: body
        }, (err: any, response: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });

      this.logger.log(`SMS sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendVerificationSMS(lead: Lead): Promise<void> {
    try {
      if (!this.messageBirdClient) {
        this.logger.warn('MessageBird client not initialized. SMS service disabled.');
        return;
      }

      if (!lead.zohoPhoneNumber) {
        this.logger.warn(`No phone number found for lead ${lead.id}`);
        return;
      }

      // Generate JWT token
      const token = this.jwtService.sign({
        email: lead.email,
        leadId: lead.id
      });

      // Create verification URL
      const verificationUrl = `${this.configService.get('APP_URL')}/user-info?token=${token}`;
const messageData = {
        firstName: lead.firstName || '',
        verificationUrl: verificationUrl,
        currentYear: new Date().getFullYear().toString(),
      };

       const message = await this.messageTemplatesService.getSmsMessage(
        MessageCategory.VERIFICATION,
        messageData
      );
      // SMS message
      // const message = `Thank you for your interest in MachineryMax! Complete your information here: ${verificationUrl}`;

      // Send SMS using MessageBird
      const success = await this.sendSms(lead.zohoPhoneNumber, message);

      if (success) {
        this.logger.log(`Verification SMS sent to ${lead.phone}`);
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      this.logger.error(`Failed to send verification SMS: ${error.message}`);
      throw error;
    }
  }
} 