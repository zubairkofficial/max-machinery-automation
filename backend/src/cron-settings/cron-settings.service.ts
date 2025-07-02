import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CronSetting } from './entities/cron-setting.entity';
import { UpdateCronSettingDto } from './dto/update-cron-setting.dto';
import { ScheduledCallsService } from '../leads/scheduled-calls.service';

@Injectable()
export class CronSettingsService implements OnModuleInit {
  private readonly logger = new Logger(CronSettingsService.name);

  constructor(
    @InjectRepository(CronSetting)
    private cronSettingsRepository: Repository<CronSetting>,
    private schedulerRegistry: SchedulerRegistry,
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
              jobName: 'zohoCrmSync',  
              description: 'Synchronizes data with Zoho CRM to ensure up-to-date information.', 
              isEnabled: true 
          },
          { 
              jobName: 'RescheduleCall',  
              description: 'Reschedules calls for users who did not pick up during the initial attempt.', 
              isEnabled: true 
          },
          { 
              jobName: 'ReminderCall',  
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
     
    }
    this.logger.log('Cron jobs initialized.');
  }

  addCronJob(name: string, cronExpression: string) {
    let jobCallback: () => void;

    switch (name) {
      case 'zohoSync':
        jobCallback = () => this.logger.warn('ZohoSync job is disabled - service was removed');
        break;
      case 'individualScheduledCalls':
        jobCallback = () => this.scheduledCallsService.handleIndivitualReScheduledCall();
        break;
      case 'batchScheduledCalls':
        jobCallback = () => this.scheduledCallsService.handleScheduledCalls();
        break;
      default:
        this.logger.warn(`No callback defined for cron job: ${name}`);
        return;
    }

    const job = new CronJob(cronExpression, jobCallback);

    try {
        this.schedulerRegistry.addCronJob(name, job);
        job.start();
    } catch (e) {
        this.logger.error(`Error adding cron job "${name}". A job with this name might already exist.`, e.stack);
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
  async getByName(jobName:string) {
    return this.cronSettingsRepository.findOne({where:{jobName}});
  }

  async update(jobName: string, updateDto: UpdateCronSettingDto) {
    const setting = await this.cronSettingsRepository.findOne({ where: { jobName } });
    if (!setting) {
      this.logger.error(`Cron job "${jobName}" not found`);
        // handle not found
    }
    
    this.deleteCronJob(jobName);

    Object.assign(setting, updateDto);

    setting.startTime = updateDto.startTime ? new Date(updateDto.startTime) : null;
    setting.endTime = updateDto.endTime ? new Date(updateDto.endTime) : null;

    return this.cronSettingsRepository.save(setting);
  }
} 