import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { JwtModule } from '@nestjs/jwt';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';

@Module({
  imports: [
    ConfigModule,
    MessageTemplatesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET || 'secret-key',
       signOptions: { expiresIn: '365d' }
      }),
    }),
  ],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {} 