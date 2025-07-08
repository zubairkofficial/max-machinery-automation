import { Injectable, Logger, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, ILike, Not } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CallHistory } from './entities/call-history.entity';
import { LastCall } from './entities/last-call.entity';
import { ApolloService } from '../apollo/apollo.service';
import { SearchLeadsDto } from '../apollo/dto/search-leads.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { In } from 'typeorm';
import { RetellAiService } from './retell-ai.service';
import { ScheduleCallsDto } from './dto/schedule-calls.dto';
import axios from 'axios';
import { ScheduledCallsService } from './scheduled-calls.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { RetellService } from 'src/retell/retell.service';
import { CronSettingsService } from 'src/cron-settings/cron-settings.service';
import { JobName } from 'src/cron-settings/enums/job-name.enum';
import { CallDashboardFilterDto } from './dto/call-filter.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private readonly retellApiKey: string;
  private readonly retellApiBaseUrl = 'https://api.retellai.com/v2';

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(LastCall)
    private lastCallRepository: Repository<LastCall>,
    private apolloService: ApolloService,
    private retellAiService: RetellAiService,
    private readonly configService: ConfigService,
    private readonly retellService: RetellService,
    private readonly cronSettingsService: CronSettingsService,
  ) {
    this.retellApiKey = this.configService.get<string>('RETELL_AI_API_KEY');
  }

  @OnEvent('call.completed')
  async handleCallCompleted(callDetails: any) {
    await this.updateLeadCallHistory(callDetails.lead_id, callDetails);
  }

  @OnEvent('call.failed')
  async handleCallFailed(callDetails: any) {
    await this.updateLeadCallHistory(callDetails.lead_id, callDetails);
  }

  async findAll(options: { 
    page?: number; 
    limit?: number;
    status?: string;
    industry?: string;
  }): Promise<{ data: Lead[]; pagination: { total: number; page: number; limit: number } }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    
    const queryBuilder = this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.callHistoryRecords', 'callHistory')
      .leftJoinAndSelect('lead.lastCallRecord', 'lastCall');

    // Apply status filter
    if (options.status) {
      switch (options.status) {
        case 'contacted':
          queryBuilder.andWhere('lead.contacted = :contacted', { contacted: true });
          break;
        case 'not-contacted':
          queryBuilder.andWhere('lead.contacted = :contacted', { contacted: false });
          break;
        case 'qualified':
          queryBuilder.andWhere('lead.status = :status', { status: 'qualified' });
          break;
        case 'not-interested':
          queryBuilder.andWhere('lead.status = :status', { status: 'not-interested' });
          break;
        default:
          if (options.status !== 'all') {
            queryBuilder.andWhere('lead.status = :status', { status: options.status });
          }
      }
    }

    // Apply industry filter
    if (options.industry && options.industry !== 'all') {
      queryBuilder.andWhere('lead.industry = :industry', { industry: options.industry });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder
      .orderBy('lead.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const leads = await queryBuilder.getMany();

    return {
      data: leads,
      pagination: {
        total,
        page,
        limit
      }
    };
  }

  async findAllWithScheduledCalls() {
 
    return  this.leadRepository.find({where: {contacted: false,status:Not("CALLING")} })
  
    
  }

  async findSurplusMachineryLeads(options?: { page: number, limit: number }): Promise<{ data: Lead[]; pagination: { total: number; page: number; limit: number } }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    
    const [leads, total] = await this.leadRepository.findAndCount({
      where: { hasSurplusMachinery: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: {
        callHistoryRecords: true,
        lastCallRecord: true
      }
    });

    return { 
      data: leads, 
      pagination: {
        total,
        page,
        limit
      }
    };
  }

  async findPriorityLeads(options?: { page: number, limit: number }): Promise<{ data: Lead[]; pagination: { total: number; page: number; limit: number } }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    
    const [leads, total] = await this.leadRepository.findAndCount({
      where: [
        { hasSurplusMachinery: true },
        { 
          jobTitle: In(['Owner', 'CEO', 'President', 'Managing Director']),
          industry: In(['Manufacturing', 'Industrial Equipment', 'Machinery'])
        }
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { 
        hasSurplusMachinery: 'DESC',
        createdAt: 'DESC' 
      },
      relations: {
        callHistoryRecords: true,
        lastCallRecord: true
      }
    });

    return { 
      data: leads, 
      pagination: {
        total,
        page,
        limit
      }
    };
  }

  async findOne(id: string): Promise<Lead> {
    return this.leadRepository.findOne({
      where: { id },
      relations: {
        callHistoryRecords: true,
        lastCallRecord: true
      }
    });
  }

  async getByLeadId(id: string): Promise<Lead> {
    return this.leadRepository.findOne({
      where: { id },
      
    });
  }
  async getByRetellId(id: string) {
    return this.retellService.getRetellLLM(id);
  }

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadRepository.create(createLeadDto);
    return this.leadRepository.save(lead);
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    await this.leadRepository.update(id, updateLeadDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.leadRepository.delete(id);
  }

  async fetchLeadsFromApollo(searchParams: SearchLeadsDto): Promise<{ leads: Lead[]; stats: any }> {
    try {
      this.logger.log(`Fetching leads from Apollo with parameters: ${JSON.stringify(searchParams)}`);
      const apolloResponse = await this.apolloService.searchLeads(searchParams);
      
      // Count stats
      let newLeadsCount = 0;
      let updatedLeadsCount = 0;
      
      // Transform Apollo leads to our Lead entity format
      const leads = await Promise.all(
        apolloResponse.leads.map(async (apolloLead) => {
          // Check if the lead already exists
          const existingLead = await this.leadRepository.findOne({
          where:  {leadId: apolloLead.id},
          });

          if (existingLead) {
            this.logger.log(`Lead with email ${apolloLead.email} already exists, updating with new data.`);
            
            // Create a separate updated lead for database update
            const updatedLead = await this.findOne(existingLead.id);
            
            // Update the additional info
            if (!updatedLead.additionalInfo) {
              updatedLead.additionalInfo = {};
            }
            
            updatedLead.additionalInfo = {
              ...updatedLead.additionalInfo,
              lastFoundWith: JSON.stringify(searchParams),
              lastSyncDate: new Date().toISOString(),
              rawData: apolloLead,
            };
            
            // Update other fields that might have changed
            updatedLead.phone = apolloLead.organization.phone || updatedLead.phone;
            updatedLead.jobTitle = apolloLead.title || updatedLead.jobTitle;
            updatedLead.linkedinUrl = apolloLead.linkedin_url || updatedLead.linkedinUrl;
            
            // Save the updated lead
            await this.leadRepository.save(updatedLead);
            
            updatedLeadsCount++;
            return updatedLead;
          }

          // Create a new lead from Apollo data
          const newLead = this.leadRepository.create({
            firstName: apolloLead.first_name,
            lastName: apolloLead.last_name,
            email: apolloLead.email,
            phone: apolloLead.organization.phone || null,
            leadId: apolloLead.id,
            company: apolloLead.organization?.name || null,
            jobTitle: apolloLead.title || null,
            industry: apolloLead.organization?.industry || null,
            linkedinUrl: apolloLead.linkedin_url || null,
            location: apolloLead.location?.city 
              ? `${apolloLead.location.city}, ${apolloLead.location.state}, ${apolloLead.location.country}`
              : null,
            additionalInfo: {
              seniority: apolloLead.seniority,
              departments: apolloLead.departments,
              apolloId: apolloLead.id,
              rawData: apolloLead,
              searchParams: JSON.stringify(searchParams), // Store the search parameters used as JSON string
              firstFoundDate: new Date().toISOString(),
              lastFoundWith: JSON.stringify(searchParams),
              lastSyncDate: new Date().toISOString(),
            },
            source: 'apollo',
            leadSource: 'apollo',
            status: 'new',
            contacted: false,
          });

          newLeadsCount++;
          return this.leadRepository.save(newLead);
        }),
      );

      this.logger.log(`Apollo search completed: ${newLeadsCount} new leads created, ${updatedLeadsCount} leads updated`);
      
      return {
        leads: leads.filter(Boolean), // Filter out any null values
        stats: {
          total: apolloResponse.pagination.total,
          saved: newLeadsCount,
          updated: updatedLeadsCount,
          page: apolloResponse.pagination.page,
          totalPages: apolloResponse.pagination.totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch leads from Apollo: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getApolloSearchHistory(): Promise<any> {
    try {
      // Find all leads that were found with Apollo searches
      const apolloLeads = await this.leadRepository.find({
        where: { source: 'apollo' },
        order: { updatedAt: 'DESC' },
        take: 100, // Limit to the last 100 leads
      });

      // Extract search parameters and organize by date
      const searchHistory: Record<string, {
        date: string;
        searchParams: any;
        leadCount: number;
        leads: Array<{
          id: string;
          name: string;
          email: string;
          company: string;
          jobTitle: string;
          createdAt: Date;
          updatedAt: Date;
        }>;
      }> = {};

      apolloLeads.forEach(lead => {
        if (lead.additionalInfo?.lastSyncDate) {
          const syncDate = lead.additionalInfo.lastSyncDate;
          if (!searchHistory[syncDate]) {
            searchHistory[syncDate] = {
              date: syncDate,
              searchParams: lead.additionalInfo.lastFoundWith 
                ? JSON.parse(lead.additionalInfo.lastFoundWith) 
                : null,
              leadCount: 0,
              leads: []
            };
          }
          
          searchHistory[syncDate].leadCount++;
          
          // Add a summary of this lead to the search history
          searchHistory[syncDate].leads.push({
            id: lead.id,
            name: `${lead.firstName}`,
            email: lead.email,
            company: lead.company,
            jobTitle: lead.jobTitle,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
          });
        }
      });

      // Convert to array and sort by date
      const result = Object.values(searchHistory).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      return {
        searchHistory: result,
        totalSearches: result.length,
        totalLeadsFound: apolloLeads.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get Apollo search history: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Schedules or makes calls to leads using RetellAI
   */
  async scheduleCallsToLeads(scheduleDto: ScheduleCallsDto): Promise<{
    success: boolean;
    scheduled: number;
    skipped: number;
    errors: any[];
    callDetails: any[];
    scheduledTime?: string;
    endTime?: string;
    message?: string;
  }> {
    try {
      // Determine which leads would be called
      let leadIds: string[] = [];
      
      if (scheduleDto.allLeads) {
        const result = await this.findAll({ page: 1, limit: 1000 });
        leadIds = result.data.map(lead => lead.id);
      } else if (scheduleDto.leadIds && scheduleDto.leadIds.length > 0) {
        leadIds = scheduleDto.leadIds;
      } else {
        throw new Error('Please specify leadIds or allLeads');
      }

      // Check if this is time-only scheduling (daily scheduling)
      if (scheduleDto.startTime) {
        // Update or create ScheduleCalls cron setting for daily execution
        await this.cronSettingsService.updateCronSetting('ScheduleCalls', {
          isEnabled: true,
          startTime: scheduleDto.startTime,
          endTime: scheduleDto.endTime
        });

        const message = `Daily calls scheduled for ${scheduleDto.startTime}${scheduleDto.endTime ? ` to ${scheduleDto.endTime}` : ''}`;
        
        return {
          success: true,
          scheduled: leadIds.length,
          skipped: 0,
          errors: [],
          callDetails: [],
          scheduledTime: scheduleDto.startTime,
          endTime: scheduleDto.endTime,
          message
        };
      } else {
        // Immediate calling - execute now
        const callResults = [];
        const errors = [];
        let scheduled = 0;
        let skipped = 0;

        for (const leadId of leadIds) {
          try {
            const lead = await this.findOne(leadId);
            if (!lead || !lead.phone) {
              skipped++;
              continue;
            }

            const callResult = await this.retellAiService.makeCall(
              scheduleDto.fromNumber || this.configService.get<string>('FROM_PHONE_NUMBER'),
              lead.phone,
              lead.id,
             JobName.SCHEDULED_CALLS,
              scheduleDto.overrideAgentId || this.configService.get<string>('AGENT_ID')
            );

            await this.updateLeadCallHistory(lead.id, {
              ...callResult,
              fromNumber: scheduleDto.fromNumber || this.configService.get<string>('FROM_PHONE_NUMBER'),
              toNumber: lead.phone,
              agent_id: scheduleDto.overrideAgentId || this.configService.get<string>('AGENT_ID')
            });

            callResults.push({
              leadId: lead.id,
              callId: callResult.call_id,
              callResult
            });
            scheduled++;

            // Add delay between calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            this.logger.error(`Failed to call lead ${leadId}: ${error.message}`);
            errors.push({ leadId, error: error.message });
            skipped++;
          }
        }
      
      return {
        success: true,
          scheduled,
          skipped,
          errors,
          callDetails: callResults,
          message: `Successfully initiated ${scheduled} calls, skipped ${skipped}`
        };
      }
    } catch (error) {
      this.logger.error(`Failed to schedule calls: ${error.message}`, error.stack);
      throw error;
    }
  }
  

   async findAllWithIndivitualScheduledCalls() {
   const now=new Date();
    const startOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0); // Start of the current minute
        const endOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 59, 999); // End of the current minute
     
      return this.leadRepository.find({
      where: {
        scheduledCallbackDate: Between(startOfMinute, endOfMinute),
     status:Not ('CALLING'),
      },
    });
      
    }
    
  /**
   * Update lead's call history
   */
  public async updateLeadCallHistory(leadId: string, callDetails: any): Promise<void> {
    try {
      const lead = await this.findOne(leadId);
      
      if (!lead) {
        throw new Error(`Lead not found with ID: ${leadId}`);
      }
      
      // Create new call history record
      const callHistory = this.callHistoryRepository.create({
        lead_id: leadId,
        callId: callDetails.callId || callDetails.call_id,
        callType: callDetails.callType || callDetails.call_type,
        agentId: callDetails.agentId || callDetails.agent_id,
        status: callDetails.status || callDetails.call_status,
        fromNumber: callDetails.fromNumber || callDetails.from_number,
        toNumber: callDetails.toNumber || lead.phone,
        direction: callDetails.direction,
        telephonyIdentifier: callDetails.telephonyIdentifier,
        latency: callDetails.latency,
        callCost: callDetails.callCost || callDetails.call_cost,
        startTimestamp: callDetails.startTimestamp || callDetails.start_timestamp || Date.now(),
        endTimestamp: callDetails.endTimestamp || callDetails.end_timestamp,
        // Add new fields
        duration_ms: callDetails.duration_ms,
        disconnection_reason: callDetails.disconnection_reason,
        opt_out_sensitive_data_storage: callDetails.opt_out_sensitive_data_storage || false,
        opt_in_signed_url: callDetails.opt_in_signed_url || false,
        // Keep existing fields
        callQuality: callDetails.callQuality,
        analytics: callDetails.analytics,
        sentiment: callDetails.sentiment
      });
      
      await this.callHistoryRepository.save(callHistory);

      // Update or create last call record
     let lastCall = await this.lastCallRepository.findOne({ 
  where: { lead_id: leadId },
  order: { timestamp: 'DESC' } // Get the most recent call
});
      
      if (!lastCall) {
        lastCall = this.lastCallRepository.create({
          lead_id: leadId
        });
      }

      lastCall.callId = callDetails.callId || callDetails.call_id;
      lastCall.status = callDetails.status || callDetails.call_status;
      lastCall.timestamp = callDetails.startTimestamp || callDetails.start_timestamp || Date.now();
      
      await this.lastCallRepository.save(lastCall);
      await this.leadRepository.update(leadId, {
        contacted: true,
        status: callDetails.status || callDetails.call_status,
        });
      this.logger.log(`Updated call history for lead ${leadId} with call ${callDetails.callId || callDetails.call_id}`);
    } catch (error) {
      this.logger.error(`Failed to update call history for lead ${leadId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get call history for a lead
   */
  async getLeadCallHistory(leadId: string): Promise<CallHistory[]> {
    try {
      const callHistory = await this.callHistoryRepository.find({
        where: { lead_id: leadId },
        order: { 
          startTimestamp: 'DESC',
          createdAt: 'DESC'
        },
        relations: {
          lead: true
        }
      });
      
      return callHistory;
    } catch (error) {
      this.logger.error(`Failed to get call history for lead ${leadId}: ${error.message}`);
      throw error;
    }
  }

  async getCallsList() {
    try {
      // Get all call history records with lead information
      const callHistoryRecords = await this.callHistoryRepository.find({
        order: {
          startTimestamp: 'DESC',
          createdAt: 'DESC'
        },
        relations: {
          lead: true
        },
        take: 100 // Limit to last 100 calls
      });

      return {
        success: true,
        calls: callHistoryRecords.map(record => ({
          id: record.callId,
          type: record.callType,
          agentId: record.agentId,
          status: record.status,
          startTimestamp: record.startTimestamp,
          endTimestamp: record.endTimestamp,
          fromNumber: record.fromNumber,
          toNumber: record.toNumber,
          direction: record.direction,
          telephonyIdentifier: record.telephonyIdentifier,
          dynamicVariables: null,
          callQuality: record.callQuality,
          analytics: record.analytics,
          sentiment: record.sentiment,
          lead: record.lead ? {
            id: record.lead.id,
            name: `${record.lead.firstName} ${record.lead.lastName}`,
            company: record.lead.company,
            phone: record.lead.phone
          } : null
        }))
      };
    } catch (error) {
      console.error('Error fetching calls:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch calls',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCallHistory(leadId: string) {
    try {
      const response = await axios.get(
        `${this.retellApiBaseUrl}/calls/${leadId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.retellApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        callHistory: response.data
      };
    } catch (error) {
      console.error('Error fetching call history from RetellAI:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch call history from RetellAI',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCallById(callId: string) {
    try {
      // First try to find the call in our database
      const call = await this.callHistoryRepository.findOne({
        where: { callId },
        relations: ['lead']
      });
   
       const response = await axios.get(
        `${this.retellApiBaseUrl}/get-call/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.retellApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const retellCall = response.data;
  if(call) {
    await this.updateLeadCallHistory(call.lead_id, retellCall);
  }
      // Transform RetellAI response to match our format
      return {
        id: retellCall.id || retellCall.call_id, // Use call_id as fallback
        call_id: retellCall.call_id,
        status: retellCall.status || retellCall.call_status,
        startTimestamp: typeof retellCall.start_timestamp === 'string' ? Number(retellCall.start_timestamp) : retellCall.start_timestamp,
        endTimestamp: retellCall.end_timestamp ? (typeof retellCall.end_timestamp === 'string' ? Number(retellCall.end_timestamp) : retellCall.end_timestamp) : null,
        duration_ms: retellCall.duration_ms,
        fromNumber: retellCall.from_number,
        toNumber: retellCall.to_number,
        direction: retellCall.direction,
        disconnection_reason: retellCall.disconnection_reason,
        callQuality: retellCall.call_quality,
        analytics: retellCall.analytics,
        sentiment: retellCall.sentiment,
           leadId: call.lead?.id,
          leadName: call.lead ? `${call.lead.firstName} ${call.lead.lastName}` : 'Unknown',
          leadCompany: call.lead?.company || 'Unknown Company',
          leadJobTitle: call.lead?.jobTitle,
          leadEmail: call.lead?.email,
          leadPhone: call.lead?.phone,
        callCost: {
          combined_cost: retellCall.call_cost?.combined_cost || 0,
          product_costs: retellCall.call_cost?.product_costs || [],
          total_duration_seconds: retellCall.call_cost?.total_duration_seconds || 0,
          total_duration_unit_price: retellCall.call_cost?.total_duration_unit_price || 0
        },
        recording_url:retellCall.recording_url || null,
        transcription: retellCall.transcription || null,
        dynamicVariables: retellCall.dynamic_variables || null,
        telephonyIdentifier: retellCall.telephony_identifier || null,
        agentId: retellCall.agent_id || null,
        callType: retellCall.call_type || 'outbound', // Default to outbound if not specified
        // Additional fields
        opt_out_sensitive_data_storage: retellCall.opt_out_sensitive_data_storage || false,
        opt_in_signed_url: retellCall.opt_in_signed_url || false
      };
    } catch (error: any) {
      this.logger.error('Error fetching call details:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch call details',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllCallHistory(options: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: CallHistory[]; total: number; page: number; limit: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;

      const queryBuilder = this.callHistoryRepository
        .createQueryBuilder('callHistory')
        .leftJoinAndSelect('callHistory.lead', 'lead')
        .orderBy('callHistory.startTimestamp', 'DESC');

      // Apply status filter
      if (options.status && options.status !== 'all') {
        queryBuilder.andWhere('callHistory.status = :status', { status: options.status });
      }

      // Apply date range filter
      if (options.startDate) {
        queryBuilder.andWhere('callHistory.startTimestamp >= :startDate', {
          startDate: new Date(options.startDate).getTime()
        });
      }

      if (options.endDate) {
        queryBuilder.andWhere('callHistory.startTimestamp <= :endDate', {
          endDate: new Date(options.endDate).getTime()
        });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit);

      const callHistory = await queryBuilder.getMany();

      return {
        data: callHistory,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error('Error fetching all call history:', error.message);
      throw new HttpException(
        'Failed to fetch call history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all call history in descending order with enhanced filtering and pagination
   */
  async getAllCallHistoryDescending(filters: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    name?: string;
    reschedule?: string;
    linkClicked?: string;
    formSubmitted?: string;
  }): Promise<{ data: CallHistory[]; total: number; page: number; limit: number }> {
    try {
      const page = Math.max(1, filters?.page || 1);
      const limit = Math.min(100, Math.max(1, filters?.limit || 50)); // Ensure reasonable limits

      const queryBuilder = this.callHistoryRepository
        .createQueryBuilder('callHistory')
        .leftJoinAndSelect('callHistory.lead', 'lead')
        .orderBy('callHistory.startTimestamp', 'DESC')
        .addOrderBy('callHistory.createdAt', 'DESC'); // Secondary sort for consistency

      // Apply status filter with validation
      if (filters.status && filters.status !== 'all' && filters.status.trim() !== '') {
        queryBuilder.andWhere('LOWER(callHistory.status) = LOWER(:status)', { 
          status: filters.status.trim() 
        });
      }

      // Apply date range filters with proper validation
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (!isNaN(startDate.getTime())) {
          queryBuilder.andWhere('callHistory.startTimestamp >= :startDate', {
            startDate: startDate.getTime()
          });
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        if (!isNaN(endDate.getTime())) {
          // Set end of day for end date
          endDate.setHours(23, 59, 59, 999);
          queryBuilder.andWhere('callHistory.startTimestamp <= :endDate', {
            endDate: endDate.getTime()
          });
        }
      }

      // Apply name search filter (search in firstName and lastName)
      if (filters.name && filters.name.trim() !== '') {
        const searchTerm = filters.name.trim();
        queryBuilder.andWhere(
          '(LOWER(lead.firstName) LIKE LOWER(:searchTerm) OR LOWER(lead.lastName) LIKE LOWER(:searchTerm) OR LOWER(CONCAT(lead.firstName, \' \', lead.lastName)) LIKE LOWER(:searchTerm))',
          { searchTerm: `%${searchTerm}%` }
        );
      }

      // Apply reschedule filter
      if (filters.reschedule && filters.reschedule !== 'all') {
        if (filters.reschedule === 'scheduled') {
          queryBuilder.andWhere('lead.scheduledCallbackDate IS NOT NULL');
        } else if (filters.reschedule === 'not_scheduled') {
          queryBuilder.andWhere('lead.scheduledCallbackDate IS NULL');
        }
      }

      // Apply link clicked filter
      if (filters.linkClicked && filters.linkClicked !== 'all') {
        if (filters.linkClicked === 'clicked') {
          queryBuilder.andWhere('lead.linkClicked = :linkClicked', { linkClicked: true });
        } else if (filters.linkClicked === 'not_clicked') {
          queryBuilder.andWhere('(lead.linkClicked = :linkClicked OR lead.linkClicked IS NULL)', { linkClicked: false });
        }
      }

      // Apply form submitted filter
      if (filters.formSubmitted && filters.formSubmitted !== 'all') {
        if (filters.formSubmitted === 'submitted') {
          queryBuilder.andWhere('lead.formSubmitted = :formSubmitted', { formSubmitted: true });
        } else if (filters.formSubmitted === 'not_submitted') {
          queryBuilder.andWhere('(lead.formSubmitted = :formSubmitted OR lead.formSubmitted IS NULL)', { formSubmitted: false });
        }
      }

      // Get total count before pagination
      const total = await queryBuilder.getCount();

      // Apply pagination
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit);

      const callHistory = await queryBuilder.getMany();

      // Create filter summary for logging
      const activeFilters = Object.entries(filters)
        .filter(([key, value]) => value && value !== 'all' && value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');

      this.logger.log(`Call history query: ${callHistory.length}/${total} records (page ${page}/${Math.ceil(total/limit)}) ${activeFilters ? `with filters: ${activeFilters}` : 'no filters'}`);

      return {
        data: callHistory,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error('Error fetching call history in descending order:', {
        message: error.message,
        stack: error.stack,
        filters
      });
      throw new HttpException(
        `Failed to fetch call history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Make a single call to a lead
   */
  async callSingleLead(
    id: string,
    callParams: { toNumber: string, override_agent_id?: string }
  ) {
    try {
      const fromNumber =  this.configService.get<string>('FROM_PHONE_NUMBER');
      
      // // If startTime is provided, handle time-only daily scheduling
      // if (callParams.startTime) {
      //   // This is time-only scheduling (HH:MM format) for daily execution
      //   const lead = await this.findOne(id);
      //   if (!lead) {
      //     throw new Error('Lead not found');
      //   }

      //   // Set up individual reschedule for this lead with the given time
      //   const today = new Date();
      //   const [hours, minutes] = callParams.startTime.split(':').map(Number);
      //   const scheduledDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        
      //   // If the time has already passed today, schedule for tomorrow
      //   if (scheduledDateTime <= new Date()) {
      //     scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
      //   }

      //   // Update the lead's scheduledCallbackDate for the individual reschedule cron
      //   await this.update(id, { 
      //     scheduledCallbackDate: scheduledDateTime 
      //   });

      //   const message = `Call scheduled for daily execution at ${callParams.startTime}${callParams.endTime ? ` (until ${callParams.endTime})` : ''}`;
        
      //   const result = {
      //     success: true,
      //     scheduled: 1,
      //     skipped: 0,
      //     errors: [],
      //     callDetails: [{
      //       leadId: id,
      //       name: 'Daily Scheduled Call',
      //       phone: callParams.toNumber,
      //       callResult: {
      //         call_status: 'scheduled',
      //         scheduled_time: callParams.startTime,
      //         end_time: callParams.endTime
      //       }
      //     }],
      //     message
      //   };

      //   return result;
      // }
      
      // For immediate calls, use the RetellAI service directly
      try {
        const callResult = await this.retellAiService.makeCall(
          fromNumber,
          callParams.toNumber,
          // this.configService.get<string>('TO_PHONE_NUMBER'),
          id,
         JobName.SCHEDULED_CALLS,
          callParams.override_agent_id,
          
        );
        
        // Update lead call history
        await this.updateLeadCallHistory(id, {
          ...callResult,
          fromNumber,
          toNumber:callParams.toNumber,
          agent_id: callParams.override_agent_id
        });
        
        return {
          success: true,
          scheduled: 0,
          skipped: 0,
          errors: [],
          callDetails: [{
            leadId: id,
            callId: callResult.call_id || callResult.callId,
            callResult
          }]
        };
      } catch (error) {
        this.logger.error(`Failed to make call: ${error.message}`);
        
        // Update lead call history with error
        await this.updateLeadCallHistory(id, {
          call_status: 'error',
          error: error.message,
          fromNumber,
          toNumber: callParams.toNumber,
          agent_id: callParams.override_agent_id,
          callId: `error-${Date.now()}`
        });
        
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to make call to lead ${id}: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to make call',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update call details after the call ends
   */

  async updateCallDetails(leadId: string, callId: string, callDetails: any): Promise<void> {
    try {
      // Find the call history record
      const callHistory = await this.callHistoryRepository.findOne({
        where: { lead_id: leadId, callId: callId }
      });
      
      if (!callHistory) {
        throw new Error(`Call ${callId} not found in lead's history`);
      }
      
      // Update the call details
      Object.assign(callHistory, {
        ...callDetails,
        endTimestamp: Date.now()
      });
      
      await this.callHistoryRepository.save(callHistory);

      // Update last call status if this is the most recent call
      const lastCall = await this.lastCallRepository.findOne({
        where: { lead_id: leadId }
      });

      if (lastCall && lastCall.callId === callId) {
        lastCall.status = callDetails.status || lastCall.status;
        await this.lastCallRepository.save(lastCall);
      }
      
      this.logger.log(`Updated call details for lead ${leadId}, call ${callId}`);
    } catch (error) {
      this.logger.error(`Failed to update call details for lead ${leadId}, call ${callId}: ${error.message}`);
      throw error;
    }
  }
  async updateLeads(leadId: string, callDetails: any) {
    try {
      // Find the call history record
      return await this.leadRepository.update( { id: leadId}, {
       
        contacted: true,
        status: 'contacted',
        // callHistoryRecords: callDetails
      }
       
    
        
    );
      
      
    
   } catch (error) {
       throw error;
    }
  }

  async getCallDashboard(filters: CallDashboardFilterDto) {
    const { status, startDate, endDate, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build the query
    const queryBuilder = this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.callHistoryRecords', 'callHistory')
      .leftJoinAndSelect('lead.lastCallRecord', 'lastCall');

    // Apply filters
    if (status && status !== 'all') {
      switch (status) {
        case 'contacted':
          queryBuilder.andWhere('lead.contacted = :contacted', { contacted: true });
          break;
        case 'not_contacted':
          queryBuilder.andWhere('lead.contacted = :contacted', { contacted: false });
          break;
        case 'successful':
          queryBuilder.andWhere('callHistory.status = :status', { status: 'ended' });
          break;
        case 'failed':
          queryBuilder.andWhere('callHistory.status = :status', { status: 'error' });
          break;
        case 'in_progress':
          queryBuilder.andWhere('callHistory.status IN (:...statuses)', { 
            statuses: ['initiated', 'registered', 'ringing'] 
          });
          break;
      }
    }

    // Date range filter
    if (startDate && endDate) {
      queryBuilder.andWhere(
        '(CAST(callHistory.startTimestamp AS TIMESTAMP) BETWEEN :startDate AND :endDate OR CAST(lastCall.timestamp AS TIMESTAMP) BETWEEN :startDate AND :endDate)',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }
      );
    } else if (startDate) {
      queryBuilder.andWhere(
        '(CAST(callHistory.startTimestamp AS TIMESTAMP) >= :startDate OR CAST(lastCall.timestamp AS TIMESTAMP) >= :startDate)',
        {
          startDate: new Date(startDate),
        }
      );
    } else if (endDate) {
      queryBuilder.andWhere(
        '(CAST(callHistory.startTimestamp AS TIMESTAMP) <= :endDate OR CAST(lastCall.timestamp AS TIMESTAMP) <= :endDate)',
        {
          endDate: new Date(endDate),
        }
      );
    }

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.company ILIKE :search OR lead.phone ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Get total count using a subquery to avoid join issues
    const countQuery = this.leadRepository
      .createQueryBuilder('lead')
      .select('COUNT(DISTINCT lead.id)', 'count')
      .leftJoin('lead.callHistoryRecords', 'callHistory')
      .leftJoin('lead.lastCallRecord', 'lastCall');

    // Apply the same filters to count query
    if (status && status !== 'all') {
      switch (status) {
        case 'contacted':
          countQuery.andWhere('lead.contacted = :contacted', { contacted: true });
          break;
        case 'not_contacted':
          countQuery.andWhere('lead.contacted = :contacted', { contacted: false });
          break;
        case 'successful':
          countQuery.andWhere('callHistory.status = :status', { status: 'ended' });
          break;
        case 'failed':
          countQuery.andWhere('callHistory.status = :status', { status: 'error' });
          break;
        case 'in_progress':
          countQuery.andWhere('callHistory.status IN (:...statuses)', { 
            statuses: ['initiated', 'registered', 'ringing'] 
          });
          break;
      }
    }

    if (startDate && endDate) {
      countQuery.andWhere(
        '(CAST(callHistory.startTimestamp AS TIMESTAMP) BETWEEN :startDate AND :endDate OR CAST(lastCall.timestamp AS TIMESTAMP) BETWEEN :startDate AND :endDate)',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }
      );
    } else if (startDate) {
      countQuery.andWhere(
        '(CAST(callHistory.startTimestamp AS TIMESTAMP) >= :startDate OR CAST(lastCall.timestamp AS TIMESTAMP) >= :startDate)',
        {
          startDate: new Date(startDate),
        }
      );
    } else if (endDate) {
      countQuery.andWhere(
        '(CAST(callHistory.startTimestamp AS TIMESTAMP) <= :endDate OR CAST(lastCall.timestamp AS TIMESTAMP) <= :endDate)',
        {
          endDate: new Date(endDate),
        }
      );
    }

    if (search) {
      countQuery.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.company ILIKE :search OR lead.phone ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const { count } = await countQuery.getRawOne();
    const total = Number(count);

    // Apply ordering and pagination
    queryBuilder
      .distinctOn(['lead.id'])
      .orderBy('lead.id')  // First ORDER BY must match DISTINCT ON
      .addOrderBy('lastCall.timestamp', 'DESC', 'NULLS LAST')
      .addOrderBy('lead.contacted', 'ASC')
      .addOrderBy('lead.createdAt', 'DESC')
      .offset(skip)
      .limit(limit);

    // Execute query
    const leads = await queryBuilder.getMany();

    // Calculate statistics
    const statistics = await this.calculateDashboardStatistics(leads);

    // Add pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      leads,
      statistics,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    };
  }

  private async calculateDashboardStatistics(leads: Lead[]) {
    let totalLeads = 0;
    let contactedLeads = 0;
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    let totalCallDuration = 0;
    let totalCallCost = 0;

    leads.forEach(lead => {
      totalLeads++;
      if (lead.contacted) {
        contactedLeads++;
      }

      if (lead.callHistoryRecords && lead.callHistoryRecords.length > 0) {
        lead.callHistoryRecords.forEach(call => {
          totalCalls++;
          if (call.status === 'ended') successfulCalls++;
          if (call.status === 'error') failedCalls++;
          if (call.duration_ms) totalCallDuration += call.duration_ms;
          if (call.callCost?.combined_cost) totalCallCost += call.callCost.combined_cost;
        });
      }
    });

    return {
      totalLeads,
      contactedLeads,
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCallDuration,
      averageCallDuration: totalCalls > 0 ? totalCallDuration / totalCalls : 0,
      totalCallCost,
      averageCallCost: totalCalls > 0 ? totalCallCost / totalCalls : 0,
      callSuccessRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      contactRate: totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0
    };
  }

  async findLeadsForReschedule(): Promise<Lead[]> {
    // Find leads where:
    // 1. Last call was not answered/failed
    // 2. No call has been scheduled yet for rescheduling
    // 3. Last call was at least 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.callHistoryRecords', 'callHistory')
      .where('callHistory.status IN (:...failedStatuses)', { 
        failedStatuses: ['no-answer', 'failed', 'busy'] 
      })
      .andWhere('callHistory.timestamp < :oneHourAgo', { oneHourAgo })
      .andWhere('NOT EXISTS (SELECT 1 FROM scheduled_call sc WHERE sc.lead_id = lead.id)')
      .orderBy('callHistory.timestamp', 'DESC')
      .getMany();
  }

  async findLeadsForReminder(): Promise<Lead[]> {
    // Find leads where:
    // 1. Call was successful
    // 2. No form submission or link click recorded
    // 3. Last call was at least 24 hours ago
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    return this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.callHistoryRecords', 'callHistory')
      .where('callHistory.status = :status', { status: 'completed' })
      .andWhere('callHistory.timestamp < :oneDayAgo', { oneDayAgo })
      .andWhere('(lead.formSubmitted IS NULL OR lead.formSubmitted = false)')
      .andWhere('(lead.linkClicked IS NULL OR lead.linkClicked = false)')
      .andWhere('NOT EXISTS (SELECT 1 FROM scheduled_call sc WHERE sc.lead_id = lead.id)')
      .orderBy('callHistory.timestamp', 'DESC')
      .getMany();
  }
} 