import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET || 'secret-key',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {} 