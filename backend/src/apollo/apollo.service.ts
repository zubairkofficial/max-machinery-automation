import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ApolloConfigService } from './apollo-config.service';
import { catchError, firstValueFrom, map, retry, timeout, timer } from 'rxjs';
import { AxiosError } from 'axios';
import { SearchLeadsDto } from './dto/search-leads.dto';

@Injectable()
export class ApolloService {
  private readonly logger = new Logger(ApolloService.name);
  private readonly TIMEOUT_MS = 30000; // 30 seconds timeout
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 second delay between retries

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
      
      // Execute the search against Apollo API with retry logic
      const response = await firstValueFrom(
        this.httpService
          .post(`${baseUrl}/mixed_people/search`, {
            page:searchParams.page|| 1,
            per_page: searchParams.limit || 25,
            ...this.buildSearchCriteria(searchParams),
          }, {
            headers: {
              'X-Api-Key': apiKey,
            },
            timeout: this.TIMEOUT_MS, // Set timeout in axios config
          })
          .pipe(
            timeout(this.TIMEOUT_MS), // Set timeout in rxjs
            retry({
              count: this.MAX_RETRIES,
              delay: (error, retryCount) => {
                // Only retry on network errors or 5xx server errors
                if (error instanceof AxiosError) {
                  const status = error.response?.status;
                  const shouldRetry = !error.response || // Network error
                    (status && status >= 500) || // Server error
                    error.code === 'ECONNABORTED'; // Timeout
                  
                  if (!shouldRetry) {
                    throw error; // Don't retry for other errors
                  }
                }
                // Return an observable that emits after the delay
                return timer(this.RETRY_DELAY_MS * retryCount);
              },
            }),
            map((response) => response.data),
            catchError((error: AxiosError) => {
              let errorMessage = 'Failed to fetch leads from Apollo';
              let statusCode = HttpStatus.BAD_GATEWAY;

              if (error.code === 'ECONNABORTED') {
                errorMessage = `Request timed out after ${this.TIMEOUT_MS}ms`;
                statusCode = HttpStatus.REQUEST_TIMEOUT;
              } else if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                errorMessage = `Apollo API error: ${error.response.status} - ${error.response.statusText}`;
                statusCode = error.response.status;
              } else if (error.request) {
                // The request was made but no response was received
                errorMessage = 'No response received from Apollo API';
                statusCode = HttpStatus.SERVICE_UNAVAILABLE;
              }

              this.logger.error(
                `${errorMessage}: ${error.message}`,
                error.stack,
              );

              throw new HttpException(
                errorMessage,
                statusCode,
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