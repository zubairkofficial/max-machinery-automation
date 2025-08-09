import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { JwtModule } from '@nestjs/jwt';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';
import { ZohoSyncService } from 'src/leads/zoho-sync.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from 'src/leads/entities/lead.entity';
import { LeadsModule } from 'src/leads/leads.module';
import { UserInfo } from 'src/userInfo/entities/user-info.entity';
import { CronSettingsService } from 'src/cron-settings/cron-settings.service';
import { LeadCallsService } from 'src/lead_calls/lead_calls.service';
import { LeadCall } from 'src/lead_calls/entities/lead_call.entity';
import { CronSetting } from 'src/cron-settings/entities/cron-setting.entity';

@Module({
  imports: [
    ConfigModule,
    MessageTemplatesModule,
    forwardRef(() => LeadsModule),
    TypeOrmModule.forFeature([Lead,UserInfo,CronSetting,LeadCall]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET || 'secret-key',
        signOptions: { expiresIn: '365d' }
      }),
    }),
  ],
  providers: [SmsService,ZohoSyncService,CronSettingsService,LeadCallsService],
  exports: [SmsService],
})
export class SmsModule {}