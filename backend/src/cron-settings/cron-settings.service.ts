import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CronSetting } from './entities/cron-setting.entity';
import { UpdateCronSettingDto } from './dto/update-cron-setting.dto';
import { ScheduledCallsService } from '../leads/scheduled-calls.service';
import { JobName } from './enums/job-name.enum';

@Injectable()
export class CronSettingsService implements OnModuleInit {
  private readonly logger = new Logger(CronSettingsService.name);

  constructor(
    @InjectRepository(CronSetting)
    private cronSettingsRepository: Repository<CronSetting>,
    private schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => ScheduledCallsService))
    private readonly scheduledCallsService: ScheduledCallsService,
  ) {}

  async onModuleInit() {
    await this.initializeCronJobs();
  }

  async initializeCronJobs() {
    this.logger.log('Initializing cron jobs from database settings...');
    const settings = await this.cronSettingsRepository.find();
    
    if (settings.length === 0) {
      this.logger.log('No cron settings found. Seeding with default values.');
      const defaultSettings = [
        { 
          jobName: JobName.SCHEDULED_CALLS,  
          description: 'Schedules calls for users who have not been contacted yet.', 
          isEnabled: true 
        },
        { 
          jobName: JobName.RESCHEDULE_CALL,  
          description: 'Reschedules calls for users who did not pick up during the initial attempt.', 
          isEnabled: true 
        },
        { 
          jobName: JobName.REMINDER_CALL,  
          description: 'Sends reminders if the user has not clicked on the link or completed the Zoho CRM form.', 
          isEnabled: true 
        },
      ];
      
      for (const setting of defaultSettings) {
        const newSetting = this.cronSettingsRepository.create(setting);
        await this.cronSettingsRepository.save(newSetting);
        settings.push(newSetting);
      }
    }

    for (const setting of settings) {
      if (setting.isEnabled && setting.startTime) {
        const [hours, minutes] = setting.startTime.split(':');
        const cronExpression = `${minutes} ${hours} * * *`;
        this.setupJobByName(setting.jobName, cronExpression);
      }
    }
    this.logger.log('Cron jobs initialized.');
  }

  private setupJobByName(jobName: JobName, cronExpression: string) {
    let jobCallback: () => Promise<void>;

    switch (jobName) {
      case JobName.SCHEDULED_CALLS:
        // jobCallback = () => this.scheduledCallsService.handleDailyScheduledCalls();
        break;
      case JobName.RESCHEDULE_CALL:
        // jobCallback = () => this.scheduledCallsService.handleRescheduleCalls();
        break;
      case JobName.REMINDER_CALL:
        // jobCallback = () => this.scheduledCallsService.handleReminderCalls();
        break;
      default:
        this.logger.warn(`No callback defined for cron job: ${jobName}`);
        return;
    }

    const job = new CronJob(cronExpression, jobCallback);

    try {
      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
      this.logger.log(`Cron job "${jobName}" scheduled with expression: ${cronExpression}`);
    } catch (e) {
      this.logger.error(`Error adding cron job "${jobName}". A job with this name might already exist.`, e.stack);
    }
  }

  deleteCronJob(name: string) {
    try {
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.log(`Cron job "${name}" deleted.`);
    } catch (e) {
      this.logger.warn(`Could not delete cron job "${name}". It might not exist.`)
    }
  }

  async findAll() {
    return this.cronSettingsRepository.find();
  }

  async getByName(jobName: JobName) {
    return this.cronSettingsRepository.findOne({ where: { jobName } });
  }

  async update(jobName: JobName, updateDto: UpdateCronSettingDto) {
    const setting = await this.cronSettingsRepository.findOne({ where: { jobName } });
    if (!setting) {
      this.logger.error(`Cron job "${jobName}" not found`);
      return null;
    }
    
    this.deleteCronJob(jobName);

    Object.assign(setting, updateDto);

    // Store times as strings in HH:MM format
    setting.startTime = updateDto.startTime || null;
    setting.endTime = updateDto.endTime || null;

    const savedSetting = await this.cronSettingsRepository.save(setting);

    // If the job is enabled and has a start time, set up the cron job
    if (savedSetting.isEnabled && savedSetting.startTime) {
      const [hours, minutes] = savedSetting.startTime.split(':');
      const cronExpression = `${minutes} ${hours} * * *`;
      this.setupJobByName(savedSetting.jobName, cronExpression);
    }

    return savedSetting;
  }

  async updateCronSetting(jobName, updateData: Partial<UpdateCronSettingDto>) {
    const setting = await this.cronSettingsRepository.findOne({ where: { jobName } });
    if (!setting) {
      this.logger.error(`Cron job "${jobName}" not found`);
      return null;
    }
    
    // Update only the provided fields
    if (updateData.startTime !== undefined) {
      setting.startTime = updateData.startTime;
    }
    if (updateData.endTime !== undefined) {
      setting.endTime = updateData.endTime;
    }
    if (updateData.isEnabled !== undefined) {
      setting.isEnabled = updateData.isEnabled;
    }
    if (updateData.description !== undefined) {
      setting.description = updateData.description;
    }
    if (updateData.callLimit !== undefined) {
      setting.callLimit = updateData.callLimit;
    }
    if (updateData.selectedDays !== undefined) {
      setting.selectedDays = updateData.selectedDays;
    }

    return this.cronSettingsRepository.save(setting);
  }
} 