import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { databaseConfig } from './config/database.config';
import { LeadsModule } from './leads/leads.module';
import { ApolloModule } from './apollo/apollo.module';
import { HttpModule } from '@nestjs/axios';
import { RetellModule } from './retell/retell.module';
import { MailModule } from './mail/mail.module';
import { SmsModule } from './sms/sms.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserInfoModule } from './userInfo/user-info.module';
import jwtConfig from './config/jwt.config';
import { MessageTemplatesModule } from './message-templates/message-templates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CronSettingsModule } from './cron-settings/cron-settings.module';
import { CategoriesModule } from './categories/categories.module';
import { LeadCallsModule } from './lead_calls/lead_calls.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    TypeOrmModule.forRoot(databaseConfig),
    HttpModule,
    UsersModule,
    AuthModule,
    LeadsModule,
    ApolloModule,
    RetellModule,
    MailModule,
    SmsModule,
    ScheduleModule.forRoot(),
    UserInfoModule,
    MessageTemplatesModule,
    DashboardModule,
    CronSettingsModule,
    CategoriesModule,
    LeadCallsModule,
 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
