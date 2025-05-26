import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private client: twilio.Twilio;
  private readonly logger = new Logger(SmsService.name);
  private enabled: boolean;
  private from: string;

  constructor(private configService: ConfigService) {
    const smsConfig = this.configService.get('sms');
    this.enabled = smsConfig.enabled;

    if (this.enabled) {
      try {
        this.client = twilio(smsConfig.accountSid, smsConfig.authToken);
        this.from = smsConfig.phoneNumber;
      } catch (error) {
        this.logger.error('Failed to initialize Twilio client', error);
        this.enabled = false;
      }
    }
  }

  async sendSms(to: string, body: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn('SMS service is disabled');
      return false;
    }

    try {
      await this.client.messages.create({
        body,
        from: this.from,
        to,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
      return false;
    }
  }

  async sendVerificationLink(to: string, token: string): Promise<boolean> {
    const url = `${this.configService.get('APP_URL') || 'https://machinerymax.com'}/form?token=${token}`;
    const message = `Thank you for your interest in MachineryMax. Please complete your information by clicking this link: ${url}`;
    
    return this.sendSms(to, message);
  }
} 