import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInfo } from './entities/user-info.entity';
import { UserInfoService } from './user-info.service';
import { UserInfoController } from './user-info.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Lead } from '../leads/entities/lead.entity';
import { ZohoSyncService } from 'src/leads/zoho-sync.service';
import { CallTranscript } from 'src/retell/entities/call-transcript.entity';
import { CronSettingsModule } from 'src/cron-settings/cron-settings.module';
import { LeadsModule } from 'src/leads/leads.module';
import { LastCall } from 'src/leads/entities/last-call.entity';
import { LeadCallsModule } from 'src/lead_calls/lead_calls.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInfo, Lead, CallTranscript, LastCall]),
    ConfigModule,
    forwardRef(() => CronSettingsModule),
    forwardRef(() => LeadsModule),
    forwardRef(() => LeadCallsModule),  // Add LeadCallsModule here
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtConfig = configService.get('jwt');
        return {
          secret: jwtConfig.secret,
          signOptions: { 
            expiresIn: jwtConfig.expiresIn 
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UserInfoController],
  providers: [
    UserInfoService,
    ZohoSyncService,
  ],
  exports: [UserInfoService],
})
export class UserInfoModule {}
