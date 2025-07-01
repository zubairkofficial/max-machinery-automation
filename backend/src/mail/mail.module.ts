import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import mailConfig from '../config/mail.config';
import { JwtService } from '@nestjs/jwt';
import { MessageTemplatesModule } from 'src/message-templates/message-templates.module';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    MessageTemplatesModule
  ],
  providers: [MailService,JwtService],
  exports: [MailService],
})
export class MailModule {} 