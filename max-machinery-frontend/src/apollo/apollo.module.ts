import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApolloConfigService } from './apollo-config.service';
import { ApolloSchedulerService } from './apollo-scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ApolloController } from './apollo.controller';
import { ApolloService } from './apollo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloConfig } from './entities/apollo-config.entity';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ApolloConfig]),
  ],
  controllers: [ApolloController],
  providers: [ApolloService, ApolloConfigService, ApolloSchedulerService],
  exports: [ApolloService, ApolloConfigService, ApolloSchedulerService],
})
export class ApolloModule {} 