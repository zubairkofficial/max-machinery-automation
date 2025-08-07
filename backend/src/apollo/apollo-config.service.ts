import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApolloConfig } from './entities/apollo-config.entity';
import { SearchLeadsDto } from './dto/search-leads.dto';

@Injectable()
export class ApolloConfigService implements OnModuleInit {
  private readonly logger = new Logger(ApolloConfigService.name);
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';
  private configId: string;

  constructor(
    @InjectRepository(ApolloConfig)
    private apolloConfigRepository: Repository<ApolloConfig>,
  ) {
    this.apiKey = process.env.APOLLO_API_KEY || 'B2MpQzi5b-vpG4WDKHyk-w';
    
    if (!this.apiKey) {
      this.logger.warn('APOLLO_API_KEY is not set in environment variables');
    }
  }

  async onModuleInit() {
    try {
      await this.loadConfigFromDatabase();
    } catch (error) {
      this.logger.error(`Failed to initialize Apollo config service: ${error.message}`, error.stack);
    }
  }

  private async loadConfigFromDatabase() {
    try {
      // Find an existing config or create a new one
      let config = await this.apolloConfigRepository.findOne({
        where: { isActive: true },
      });

      if (!config) {
        config = this.apolloConfigRepository.create({
          apiKey: this.apiKey,
          cronSchedule: '0 0 * * *', // Default: Every day at midnight
          isActive: true,
        });
        config = await this.apolloConfigRepository.save(config);
        this.logger.log('Created new Apollo configuration in database');
      } else {
        this.logger.log('Loaded existing Apollo configuration from database');
      }

      // Set the API key from the database if available
      if (config.apiKey) {
        this.apiKey = config.apiKey;
      }
      
      this.configId = config.id;
    } catch (error) {
      this.logger.error(`Failed to load Apollo config from database: ${error.message}`, error.stack);
      throw error; // Re-throw to handle in calling function
    }
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async setApiKey(apiKey: string): Promise<void> {
    try {
      this.apiKey = apiKey;
      await this.updateConfig({ apiKey });
    } catch (error) {
      this.logger.error(`Failed to set API key: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getConfig(): Promise<ApolloConfig> {
    try {
      if (!this.configId) {
        await this.loadConfigFromDatabase();
      }
      
      const config = await this.apolloConfigRepository.findOne({
        where: { id: this.configId },
      });
      
      if (!config) {
        throw new Error('Config not found after loading');
      }
      
      return config;
    } catch (error) {
      this.logger.error(`Failed to get Apollo config: ${error.message}`, error.stack);
      // Return a default config to prevent system failures
      return {
        id: 'default',
        apiKey: this.apiKey,
        jobTitles: [],
        industries: [],
        locations: [],
        companySize: '',
        keywords: '',
        companyNames: [],
        emailStatus: '',
        limit: 25,
        page: 1,
        cronSchedule: '0 0 * * *',
        isActive: true,
        lastRunAt: null,
        nextRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async updateConfig(partialConfig: Partial<ApolloConfig>): Promise<ApolloConfig> {
    try {
      if (!this.configId) {
        await this.loadConfigFromDatabase();
      }
      
      await this.apolloConfigRepository.update(
        { id: this.configId },
        partialConfig
      );
      
      return this.getConfig();
    } catch (error) {
      this.logger.error(`Failed to update Apollo config: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  async updateSearchParams(searchParams: SearchLeadsDto): Promise<ApolloConfig> {
    try {
      const config: Partial<ApolloConfig> = {};
      
      if (searchParams.jobTitles) config.jobTitles = searchParams.jobTitles;
      if (searchParams.industries) config.industries = searchParams.industries;
      if (searchParams.locations) config.locations = searchParams.locations;
      if (searchParams.companySize !== undefined) config.companySize = searchParams.companySize;
      if (searchParams.keywords !== undefined) config.keywords = searchParams.keywords;
      if (searchParams.companyNames) config.companyNames = searchParams.companyNames;
      if (searchParams.emailStatus !== undefined) config.emailStatus = searchParams.emailStatus;
      if (searchParams.limit) config.limit = searchParams.limit;
      if (searchParams.cronSchedule) config.cronSchedule = searchParams.cronSchedule;
      if (searchParams.categoryId !== undefined) config.categoryId = searchParams.categoryId;
      
      return await this.updateConfig(config);
    } catch (error) {
      this.logger.error(`Failed to update search params: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  async getSearchParamsDto(): Promise<SearchLeadsDto> {
    try {
      const config = await this.getConfig();
      
      return {
        jobTitles: config.jobTitles,
        industries: config.industries,
        locations: config.locations,
        companySize: config.companySize,
        keywords: config.keywords,
        companyNames: config.companyNames,
        emailStatus: config.emailStatus,
        limit: config.limit,
        page: config.page,
        cronSchedule: config.cronSchedule,
        categoryId: config.categoryId,
      };
    } catch (error) {
      this.logger.error(`Failed to get search params DTO: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  async updateLastRunTime(): Promise<void> {
    try {
      const now = new Date();
      await this.updateConfig({ 
        lastRunAt: now,
      });
    } catch (error) {
      this.logger.error(`Failed to update last run time: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  async updateNextRunTime(nextRunAt: Date): Promise<void> {
    try {
      await this.updateConfig({ nextRunAt });
    } catch (error) {
      this.logger.error(`Failed to update next run time: ${error.message}`, error.stack);
      throw error;
    }
  }


  // Get all config profiles
  async getAllConfigProfiles(): Promise<ApolloConfig[]> {
    try {
      return await this.apolloConfigRepository.find({
        order: { updatedAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Failed to get Apollo config profiles: ${error.message}`, error.stack);
      return [];
    }
  }

  // Delete a config profile
  async deleteConfigProfile(id: string): Promise<boolean> {
    try {
      // Don't allow deleting the default active config
      if (id === this.configId) {
        throw new Error('Cannot delete the active default config profile');
      }

      const result = await this.apolloConfigRepository.delete(id);
      return result.affected > 0;
    } catch (error) {
      this.logger.error(`Failed to delete Apollo config profile: ${error.message}`, error.stack);
      throw error;
    }
  }
} 