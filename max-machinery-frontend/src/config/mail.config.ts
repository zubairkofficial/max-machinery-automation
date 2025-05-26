import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT, 10) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER || 'your-email@gmail.com',
    pass: process.env.MAIL_PASSWORD || 'your-app-specific-password',
  },
  defaultFrom: process.env.MAIL_FROM || 'MachineryMax <your-email@gmail.com>',
})); 