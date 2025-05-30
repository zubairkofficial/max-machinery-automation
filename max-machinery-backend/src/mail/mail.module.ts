import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import mailConfig from '../config/mail.config';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
  ],
  providers: [MailService,JwtService],
  exports: [MailService],
})
export class MailModule {} 