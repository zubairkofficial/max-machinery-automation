import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ApolloConfigService } from './apollo-config.service';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { SearchLeadsDto } from './dto/search-leads.dto';

@Injectable()
export class ApolloService {
  private readonly logger = new Logger(ApolloService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ApolloConfigService,
  ) {}

  async searchLeads(searchParams: SearchLeadsDto) {
    const apiKey = this.configService.getApiKey();
    const baseUrl = this.configService.getBaseUrl();
    
    if (!apiKey) {
      throw new HttpException('Apollo API key is not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      // Store the search parameters in the database
      this.logger.log(`Storing search parameters in the database: ${JSON.stringify(searchParams)}`);
      await this.configService.updateSearchParams(searchParams);
      
      // Execute the search against Apollo API
      const response = await firstValueFrom(
       this.httpService
        .post(`${baseUrl}/mixed_people/search`, {
          page: 1,
          per_page: searchParams.limit || 25,
          ...this.buildSearchCriteria(searchParams),
        }, {
          headers: {
            'X-Api-Key': apiKey, // Set the API key in the headers
          },
        })
          .pipe(
            map((response) => response.data),
            catchError((error: AxiosError) => {
              this.logger.error(
                `Error fetching leads from Apollo: ${error.message}`,
                error.stack,
              );
              throw new HttpException(
                `Failed to fetch leads from Apollo: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      // Update last run time and calculate next run time
      await this.configService.updateLastRunTime();
      
      return {
        leads: response.people,
        pagination: {
          total: response.pagination.total_entries,
          page: response.pagination.page,
          perPage: response.pagination.per_page,
          totalPages: response.pagination.total_pages,
        },
      };
    } catch (error) {
      this.logger.error(`Error in searchLeads: ${error.message}`, error.stack);
      throw error;
    }
  }

  private buildSearchCriteria(params: SearchLeadsDto) {
    const criteria: Record<string, any> = {};

    // Map the parameters to Apollo's API query structure
    if (params.jobTitles && params.jobTitles.length > 0) {
      criteria.person_titles = params.jobTitles;
    }

    if (params.industries && params.industries.length > 0) {
      criteria.organization_industries = params.industries;
    }

    if (params.locations && params.locations.length > 0) {
      criteria.locations = params.locations;
    }

    if (params.companySize) {
      // Handle company size as either single value or comma-separated list
      if (params.companySize.includes(',')) {
        criteria.organization_size = params.companySize.split(',').map(size => size.trim());
      } else {
        criteria.organization_size = params.companySize;
      }
    }

    if (params.keywords) {
      criteria.q_keywords = params.keywords;
    }

    if (params.companyNames && params.companyNames.length > 0) {
      criteria.organization_names = params.companyNames;
    }

    if (params.emailStatus) {
      criteria.contact_email_status = params.emailStatus;
    }

    return criteria;
  }
} 