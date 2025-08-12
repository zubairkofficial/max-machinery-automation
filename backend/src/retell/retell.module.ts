import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetellService } from './retell.service';
import { RetellController } from './retell.controller';
import { CallHistory } from '../leads/entities/call-history.entity';
import { Lead } from '../leads/entities/lead.entity';
import { CallTranscript } from './entities/call-transcript.entity';
import { LastCall } from '../leads/entities/last-call.entity';
import { MailService } from 'src/mail/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { SmsService } from 'src/sms/sms.service';
import { MessageTemplate } from 'src/message-templates/entities/message-template.entity';
import { MessageTemplatesService } from 'src/message-templates/message-templates.service';
import { CronSettingsModule } from 'src/cron-settings/cron-settings.module';
import { Retell } from './entities/retell.entity';
import { LeadsModule } from '../leads/leads.module';
import { LeadCallsService } from 'src/lead_calls/lead_calls.service';
import { LeadCallsModule } from 'src/lead_calls/lead_calls.module';
import { LeadCall } from 'src/lead_calls/entities/lead_call.entity';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      CallHistory,
      Lead,
      CallTranscript,
      LastCall,
      MessageTemplate,
      Retell,
      LeadCall
    ]),
    forwardRef(() => LeadsModule),
    forwardRef(() => CronSettingsModule),
    forwardRef(() => LeadCallsModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret-key',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [RetellController],
  providers: [
    RetellService,
    MailService,
    SmsService,
    MessageTemplatesService,
    LeadCallsService
    
  ],
  exports: [RetellService],
})
export class RetellModule {}