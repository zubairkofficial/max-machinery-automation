import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Lead } from '../leads/entities/lead.entity';
import { MessageTemplatesService } from '../message-templates/message-templates.service';
import { MessageCategory } from '../message-templates/entities/message-template.entity';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly fromNumber: string;
  private readonly birdApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly messageTemplatesService: MessageTemplatesService,
  ) {
    this.apiKey = this.configService.get<string>('BIRD_API_KEY') || 'Fcd0htERi3akNCxrw7k9B7Its2yXopTdYoLg';
    this.fromNumber = this.configService.get<string>('BIRD_ORIGINATOR') || 'MachineryMax';
    this.birdApiUrl = this.configService.get<string>('BIRD_URL') || 'https://api.bird.com/workspaces/641e4d94-facc-4112-a4c9-0e8449e943c2/channels/15e09bc2-24a3-5b01-97b7-4593d79ce4b6/messages';

    if (this.apiKey) {
      this.logger.log('Bird API client initialized successfully');
    } else {
      this.logger.warn('Bird API key not found. SMS service will be disabled.');
    }
  }

  async sendSms(to: string, body: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('Bird API key not configured');
      return false;
    }

    const maxRetries = 3;
    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        const requestBody = {
          receiver: {
            contacts: [
              {
                identifierValue: to
              }
            ]
          },
          body: {
            type: "text",
            text: {
              text: body
            }
          }
        };

        const response = await fetch(this.birdApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `AccessKey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
console.log("response",response,"requestBody...",requestBody,"apiKey...",this.apiKey)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        this.logger.log(`SMS sent successfully to ${to}. Message ID: ${responseData.id}`);
        success = true;
      } catch (error) {
        retries += 1;
        this.logger.error(`Error sending SMS (attempt ${retries}): ${error.message}`);

        if (retries >= maxRetries) {
          this.logger.error(`Failed to send SMS after ${maxRetries} attempts.`);
          return false;
        }
      }
    }
    return success;
  }

  async sendVerificationSMS(lead: Lead): Promise<void> {
    try {
      if (!this.apiKey) {
        this.logger.warn('Bird API key not configured. SMS service disabled.');
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

      // Get dynamic SMS message from templates
      const messageData = {
        firstName: lead.firstName || '',
        verificationUrl: verificationUrl,
        currentYear: new Date().getFullYear().toString(),
      };

      const message = await this.messageTemplatesService.getSmsMessage(
        MessageCategory.VERIFICATION,
        messageData
      );

      // Send SMS using Bird API
      const success = await this.sendSms(lead.zohoPhoneNumber=="this number"?lead.phone:lead.zohoPhoneNumber, message);

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
