import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import mailConfig from '../config/mail.config';
import { JwtService } from '@nestjs/jwt';
import { MessageTemplatesModule } from 'src/message-templates/message-templates.module';
import { ZohoSyncService } from 'src/leads/zoho-sync.service';
import { LeadsModule } from 'src/leads/leads.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from 'src/leads/entities/lead.entity';
import { UserInfo } from 'src/userInfo/entities/user-info.entity';
import { CronSettingsService } from 'src/cron-settings/cron-settings.service';
import { CronSetting } from 'src/cron-settings/entities/cron-setting.entity';
import { LeadCallsService } from 'src/lead_calls/lead_calls.service';
import { LeadCall } from 'src/lead_calls/entities/lead_call.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead,UserInfo,CronSetting,LeadCall]),
    ConfigModule.forFeature(mailConfig),
    MessageTemplatesModule,
    forwardRef(() => LeadsModule)
  ],
  providers: [MailService,JwtService,ZohoSyncService,CronSettingsService,LeadCallsService],
  exports: [MailService],
})
export class MailModule {} 