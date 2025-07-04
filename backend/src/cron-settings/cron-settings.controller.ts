import { Controller, Get, Body, Patch, Param, UseGuards, Post } from '@nestjs/common';
import { CronSettingsService } from './cron-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCronSettingDto } from './dto/update-cron-setting.dto';
import { JobName } from './enums/job-name.enum';

@UseGuards(JwtAuthGuard)
@Controller('cron-settings')
export class CronSettingsController {
  constructor(private readonly cronSettingsService: CronSettingsService) {}

  @Get()
  findAll() {
    return this.cronSettingsService.findAll();
  }

  @Patch(':jobName')
  update(@Param('jobName') jobName: string, @Body() updateCronSettingDto: UpdateCronSettingDto) {
    return this.cronSettingsService.update(jobName as JobName, updateCronSettingDto);
  }


} 