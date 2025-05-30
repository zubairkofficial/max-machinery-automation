import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { Lead } from 'src/leads/entities/lead.entity';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  
  constructor(private configService: ConfigService,private jwtService: JwtService) {
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
       to:"muhaffan945@gmail.com",
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

  async sendVerificationLink(lead:Lead) {
    try {


      const payload={email:lead.email,leadId:lead.id}
      const token=  this.jwtService.sign(payload)

      const appUrl = `${this.configService.get('APP_URL')}/user-info?token=${token}` || `http://localhost:4000/api/v1/user-info?token=${token}`;
  
 
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center;">
            <img src="	https://mmaxstorage.blob.core.windows.net/assets/media/a94bd20a-4a87-4aff-bd45-807bc378d569.png" alt="MachineryMax" style="max-width: 200px;" />
          </div>
          <div style="padding: 20px; border: 1px solid #ddd;">
            <h2>Hello ${lead.firstName || 'there'},</h2>
            <p>Thank you for your interest in MachineryMax. To complete your information, please click the link below:</p>
            <p style="text-align: center;">
              <a href="${appUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
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
        to:lead.email,
        subject: 'Complete Your Information - MachineryMax',
        html,
      });

      this.logger.log(`Verification email sent successfully to ${lead.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${lead.email}: ${error.message}`, error.stack);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
} 