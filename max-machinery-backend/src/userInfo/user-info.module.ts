import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInfo } from './entities/user-info.entity';
import { UserInfoService } from './user-info.service';
import { UserInfoController } from './user-info.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Lead } from '../leads/entities/lead.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInfo, Lead]),
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
  providers: [UserInfoService],
  exports: [UserInfoService],
})
export class UserInfoModule {} 