import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { LeadsService } from '../leads/leads.service';
import { SearchLeadsDto } from './dto/search-leads.dto';
import { ModuleRef } from '@nestjs/core';
import { CronJob } from 'cron';
import { ApolloConfigService } from './apollo-config.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApolloConfig } from './entities/apollo-config.entity';
// Import cron-parser correctly
import { CronExpressionParser } from 'cron-parser';

@Injectable()
export class ApolloSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ApolloSchedulerService.name);
  private leadsService: LeadsService;
  private cronJob: CronJob;

  constructor(
    private moduleRef: ModuleRef,
    private schedulerRegistry: SchedulerRegistry,
    private apolloConfigService: ApolloConfigService,
    @InjectRepository(ApolloConfig)
    private apolloConfigRepository: Repository<ApolloConfig>
  ) {}

  async onModuleInit() {
    try {
      // First resolve the LeadsService
      this.leadsService = this.moduleRef.get(LeadsService, { strict: false });
      
      // Wait for database connection to be established
      setTimeout(async () => {
        try {
          await this.setupCronJob();
          this.logger.log('Cron job setup completed successfully');
        } catch (error) {
          this.logger.error(`Failed to setup cron job during delayed init: ${error.message}`);
        }
      }, 5000); // Give the database connection 5 seconds to stabilize
    } catch (error) {
      this.logger.error('Failed to inject LeadsService: ' + error.message);
    }
  }

  // Set up the cron job with the current schedule
  private async setupCronJob() {
    try {
      // Remove existing job if it exists
      try {
        this.schedulerRegistry.deleteCronJob('apolloLeadsFetch');
      } catch (e) {
        // Job doesn't exist yet, that's fine
      }

      // Get current config from database
      const config = await this.apolloConfigService.getConfig();
      
      // Create a new job with the current schedule
      const schedule = config.cronSchedule || '0 0 * * *'; // Default: daily at midnight
      
      const job = new CronJob(schedule, () => {
        this.handleLeadFetch();
      });

      // Add the job to the registry and start it
      this.schedulerRegistry.addCronJob('apolloLeadsFetch', job);
      job.start();
      
      // Calculate and store next run time
      try {
        // Use the parser correctly
        const interval = CronExpressionParser.parse(schedule);
        const nextRun = interval.next().toDate();
        await this.apolloConfigService.updateNextRunTime(nextRun);
      } catch (e) {
        this.logger.error(`Failed to parse cron expression: ${e.message}`);
      }
      
      this.logger.log(`Apollo lead fetch scheduled with cron: ${schedule}`);
    } catch (error) {
      this.logger.error(`Failed to setup cron job: ${error.message}`);
    }
  }

  // Get all active Apollo configuration profiles
  async getAllApolloConfigs(): Promise<ApolloConfig[]> {
    try {
      return this.apolloConfigRepository.find({
        where: { isActive: true },
        order: { updatedAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Failed to get Apollo configs: ${error.message}`);
      return [];
    }
  }

  // The actual fetch job function
  async handleLeadFetch() {
    this.logger.log('Running scheduled Apollo lead fetch...');
    
    if (!this.leadsService) {
      this.logger.error('LeadsService is not available, unable to fetch leads');
      return { error: 'LeadsService is not available' };
    }
    
    try {
      // Get current search parameters from database
      const searchParams = await this.apolloConfigService.getSearchParamsDto();
      
      // Execute the search
      const result = await this.leadsService.fetchLeadsFromApollo(searchParams);
      
      // Update the last run time
      await this.apolloConfigService.updateLastRunTime();
      
      // Calculate and update next run time
      try {
        // Use the parser correctly
        const interval = CronExpressionParser.parse(searchParams.cronSchedule || '0 0 * * *');
        const nextRun = interval.next().toDate();
        await this.apolloConfigService.updateNextRunTime(nextRun);
      } catch (e) {
        this.logger.error(`Failed to parse cron expression: ${e.message}`);
      }
      
      this.logger.log(
        `Successfully fetched ${result.stats.saved} new leads from Apollo (${result.stats.total} total matches)`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch leads from Apollo: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Run fetch using config with specific ID
  async runWithConfigId(configId: string): Promise<any> {
    this.logger.log(`Running Apollo lead fetch with config ID: ${configId}`);
    
    if (!this.leadsService) {
      this.logger.error('LeadsService is not available, unable to fetch leads');
      return { error: 'LeadsService is not available' };
    }
    
    try {
      // Find the specific config
      const config = await this.apolloConfigRepository.findOne({
        where: { id: configId }
      });
      
      if (!config) {
        throw new Error(`Apollo config with ID ${configId} not found`);
      }
      
      // Convert config to SearchLeadsDto
      const searchParams: SearchLeadsDto = {
        jobTitles: config.jobTitles,
        industries: config.industries,
        locations: config.locations,
        companySize: config.companySize,
        keywords: config.keywords,
        companyNames: config.companyNames,
        emailStatus: config.emailStatus,
        limit: config.limit,
        cronSchedule: config.cronSchedule,
      };
      
      // Execute the search
      const result = await this.leadsService.fetchLeadsFromApollo(searchParams);
      
      // Update the config with last run time
      config.lastRunAt = new Date();
      await this.apolloConfigRepository.save(config);
      
      this.logger.log(
        `Successfully fetched ${result.stats.saved} new leads from Apollo using config ID ${configId}`,
      );
      
      return {
        result,
        config
      };
    } catch (error) {
      this.logger.error(`Failed to fetch leads with config ID ${configId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get current search parameters
  async getDefaultSearchParams(): Promise<SearchLeadsDto> {
    return this.apolloConfigService.getSearchParamsDto();
  }

  // Update search parameters
  async updateDefaultSearchParams(searchParams: SearchLeadsDto): Promise<SearchLeadsDto> {
    // Save to database
    await this.apolloConfigService.updateSearchParams(searchParams);
    
    // If the cron schedule has changed, update the cron job
    if (searchParams.cronSchedule) {
      await this.setupCronJob();
    }
    
    this.logger.log('Updated Apollo search parameters');
    return this.getDefaultSearchParams();
  }
} 