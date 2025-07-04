import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronSettingsService } from './cron-settings.service';
import { CronSettingsController } from './cron-settings.controller';
import { CronSetting } from './entities/cron-setting.entity';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CronSetting]), 
    forwardRef(() => LeadsModule)
  ],
  controllers: [CronSettingsController],
  providers: [CronSettingsService],
  exports: [CronSettingsService],
})
export class CronSettingsModule {} 