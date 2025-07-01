import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetellService } from './retell.service';
import { RetellController } from './retell.controller';
import { CallHistory } from '../leads/entities/call-history.entity';
import { Lead } from '../leads/entities/lead.entity';
import { LeadsModule } from '../leads/leads.module';
import { CallTranscript } from './entities/call-transcript.entity';
import { LastCall } from '../leads/entities/last-call.entity';
import { ConfigModule } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { SmsService } from 'src/sms/sms.service';
import { MessageTemplate } from 'src/message-templates/entities/message-template.entity';
import { MessageTemplatesService } from 'src/message-templates/message-templates.service';
import { CronSettingsService } from 'src/cron-settings/cron-settings.service';
import { CronSetting } from 'src/cron-settings/entities/cron-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallHistory, Lead, CallTranscript, LastCall,MessageTemplate,CronSetting]),
    forwardRef(() => LeadsModule),
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET||'secret-key', // In production, use environment variables
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [RetellController],
  providers: [RetellService,MailService,SmsService,MessageTemplatesService,CronSettingsService],
  exports: [RetellService],
})
export class RetellModule {}
