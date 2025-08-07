import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Lead } from './entities/lead.entity';
import { CallHistory } from './entities/call-history.entity';
import { LastCall } from './entities/last-call.entity';
import { CallTranscript } from '../retell/entities/call-transcript.entity';
import { Category } from '../categories/entities/category.entity';

// Services
import { LeadsService } from './leads.service';
import { ScheduledCallsService } from './scheduled-calls.service';
import { CallDataMigrationService } from './call-data-migration.service';
import { RetellAiService } from './retell-ai.service';
import { ZohoSyncService } from './zoho-sync.service';

// Controllers
import { LeadsController } from './leads.controller';

// Modules
import { ApolloModule } from '../apollo/apollo.module';
import { RetellModule } from '../retell/retell.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { CronSettingsModule } from '../cron-settings/cron-settings.module';
import { UserInfo } from 'src/userInfo/entities/user-info.entity';
import { Retell } from 'src/retell/entities/retell.entity';
import { ConfigModule } from '@nestjs/config';
import { UserInfoModule } from 'src/userInfo/user-info.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead, 
      CallHistory, 
      LastCall, 
      CallTranscript,
      UserInfo,
      Retell,
      Category
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET||'secret-key', // In production, use environment variables
      signOptions: { expiresIn: '1d' },
    }),
    forwardRef(() => RetellModule),
    forwardRef(() => CronSettingsModule),
    forwardRef(() => UserInfoModule),
    ApolloModule,
    MailModule,
    SmsModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot(),
  ],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    ScheduledCallsService,
    CallDataMigrationService,
    {
      provide: RetellAiService,
      useClass: RetellAiService,
    },
    ZohoSyncService,
  ],
  exports: [
    LeadsService,
    RetellAiService,
    ScheduledCallsService,
    ZohoSyncService,
  ]
})
export class LeadsModule {}