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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CallHistory,
      Lead,
      CallTranscript,
      LastCall,
      MessageTemplate,
      Retell
    ]),
    forwardRef(() => LeadsModule),
    forwardRef(() => CronSettingsModule),
   
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [RetellController],
  providers: [
    RetellService,
    MailService,
    SmsService,
    MessageTemplatesService
  ],
  exports: [RetellService],
})
export class RetellModule {}