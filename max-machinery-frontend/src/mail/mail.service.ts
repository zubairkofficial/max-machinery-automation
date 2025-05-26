import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
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
        to,
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

  async sendVerificationLink(to: string, token: string, firstName: string) {
    try {
      const appUrl = this.configService.get('APP_URL') || 'https://machinerymax.com';
      const url = `${appUrl}/form?token=${token}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center;">
            <img src="https://machinerymax.com/logo.png" alt="MachineryMax" style="max-width: 200px;" />
          </div>
          <div style="padding: 20px; border: 1px solid #ddd;">
            <h2>Hello ${firstName || 'there'},</h2>
            <p>Thank you for your interest in MachineryMax. To complete your information, please click the link below:</p>
            <p style="text-align: center;">
              <a href="${url}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Complete Your Information
              </a>
            </p>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Best regards,<br>The MachineryMax Team</p>
          </div>
          <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
            &copy; ${new Date().getFullYear()} MachineryMax. All rights reserved.
          </div>
        </div>
      `;

      const result = await this.sendMail({
        to,
        subject: 'Complete Your Information - MachineryMax',
        html,
      });

      this.logger.log(`Verification email sent successfully to ${to}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}: ${error.message}`, error.stack);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
} 