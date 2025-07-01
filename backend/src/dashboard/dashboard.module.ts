import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Lead } from '../leads/entities/lead.entity';
import { CallHistory } from '../leads/entities/call-history.entity';
import { LastCall } from '../leads/entities/last-call.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, CallHistory, LastCall]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {} 