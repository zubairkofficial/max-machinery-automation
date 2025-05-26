import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  // Using Twilio as a common SMS service provider
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  enabled: process.env.SMS_ENABLED === 'true',
})); 