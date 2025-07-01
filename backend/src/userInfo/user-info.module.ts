import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInfo } from './entities/user-info.entity';
import { UserInfoService } from './user-info.service';
import { UserInfoController } from './user-info.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Lead } from '../leads/entities/lead.entity';
import { ZohoSyncService } from 'src/leads/zoho-sync.service';
import { CallTranscript } from 'src/retell/entities/call-transcript.entity';
import { RetellAiService } from 'src/leads/retell-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInfo, Lead,CallTranscript]),
    ConfigModule,
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
  providers: [UserInfoService,ZohoSyncService,RetellAiService],
  exports: [UserInfoService],
})
export class UserInfoModule {} 