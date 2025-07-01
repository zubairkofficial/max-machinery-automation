import { Body, Controller, Get, Post, Patch, HttpStatus, Param } from '@nestjs/common';
import { ApolloSchedulerService } from './apollo-scheduler.service';
import { SearchLeadsDto } from './dto/search-leads.dto';
import { ApolloConfigService } from './apollo-config.service';

@Controller('apollo')
export class ApolloController {
  constructor(
    private readonly apolloSchedulerService: ApolloSchedulerService,
    private readonly apolloConfigService: ApolloConfigService,
  ) {}

  @Get('config')
  async getSearchConfig() {
    return {
      defaultParameters: await this.apolloSchedulerService.getDefaultSearchParams(),
    };
  }

  @Get('configs')
  async getAllConfigs() {
    const configs = await this.apolloSchedulerService.getAllApolloConfigs();
    return {
      configs,
      count: configs.length
    };
  }

  @Post('config')
  async updateSearchConfig(@Body() searchParams: SearchLeadsDto) {
    return {
      updated: true,
      parameters: await this.apolloSchedulerService.updateDefaultSearchParams(searchParams),
    };
  }

  @Post('sync/now')
  async runSyncNow() {
    return this.apolloSchedulerService.handleLeadFetch();
  }

  @Post('sync/config/:id')
  async runSyncWithConfig(@Param('id') configId: string) {
    return this.apolloSchedulerService.runWithConfigId(configId);
  }
  
  @Patch('api-key')
  async updateApiKey(@Body('apiKey') apiKey: string) {
    if (!apiKey) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'API key is required',
      };
    }
    
    await this.apolloConfigService.setApiKey(apiKey);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Apollo API key updated successfully',
    };
  }
  
  @Get('status')
  async getApiStatus() {
    const apiKey = this.apolloConfigService.getApiKey();
    const config = await this.apolloConfigService.getConfig();
    
    return {
      configured: !!apiKey,
      message: apiKey 
        ? 'Apollo.io API is configured' 
        : 'Apollo.io API key is not configured. Please set it via the /apollo/api-key endpoint.',
      nextSyncAt: config.nextRunAt,
      lastSyncAt: config.lastRunAt,
      cronSchedule: config.cronSchedule,
    };
  }
} 