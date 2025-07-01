import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Lead } from './entities/lead.entity';
import { CallHistory } from './entities/call-history.entity';
import { LastCall } from './entities/last-call.entity';
import { ScheduledCall } from './entities/scheduled-call.entity';
import { CallTranscript } from '../retell/entities/call-transcript.entity';

// Services
import { LeadsService } from './leads.service';
import { ScheduledCallsService } from './scheduled-calls.service';
import { CallDataMigrationService } from './call-data-migration.service';
import { ZohoSyncService } from './zoho-sync.service';
import { RetellAiService } from './retell-ai.service';

// Controllers
import { LeadsController } from './leads.controller';

// Modules
import { ApolloModule } from '../apollo/apollo.module';
import { RetellModule } from '../retell/retell.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { UserInfo } from 'src/userInfo/entities/user-info.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead, 
      CallHistory, 
      LastCall, 
      ScheduledCall, 
      CallTranscript,
      UserInfo
    ]),
    
    forwardRef(() => RetellModule),
    ApolloModule,
    MailModule,
    SmsModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    ScheduledCallsService,
    CallDataMigrationService,
    RetellAiService,
    ZohoSyncService
  ],
  exports: [LeadsService,  RetellAiService, ZohoSyncService, ScheduledCallsService]
})
export class LeadsModule {} 