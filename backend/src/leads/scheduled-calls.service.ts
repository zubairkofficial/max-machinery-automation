import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledCall } from './entities/scheduled-call.entity';
import { RetellAiService } from './retell-ai.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeadsService } from './leads.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScheduledCallsService {
  private readonly logger = new Logger(ScheduledCallsService.name);

  constructor(
    @InjectRepository(ScheduledCall)
    private scheduledCallRepository: Repository<ScheduledCall>,
    private readonly configService: ConfigService,
    private retellAiService: RetellAiService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => LeadsService))
    private leadsService: LeadsService,
  ) {}

  async scheduleCall(data: {
    
    fromNumber: string;
   
    startTime: Date;
    endTime?: Date;
    overrideAgentId?: string;
   
  }): Promise<ScheduledCall> {
    const scheduledCall = this.scheduledCallRepository.create(data);
    return this.scheduledCallRepository.save(scheduledCall);
  }

  async scheduleBatchCalls(data: {
    leadIds: string[];
    fromNumber: string;
    toNumber: string;
    overrideAgentId?: string;
    startTime?: Date | string;
    endTime?: Date | string;
  }): Promise<ScheduledCall[]> {
    const now = new Date();
    
    const scheduledCalls = data.leadIds.map(leadId =>
      this.scheduledCallRepository.create({
        
        startTime: data.startTime ? new Date(data.startTime) : now,
        endTime: data.endTime ? new Date(data.endTime) : null,
      })
    );

    return this.scheduledCallRepository.save(scheduledCalls);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleIndivitualScheduledCall() {
    try {
    
      // Find all pending calls that are within their time window
      const scheduledCallsLeads = await this.leadsService.findAllWithIndivitualScheduledCalls()

      this.logger.log(`Found ${scheduledCallsLeads.length} calls to process`);

      for (const scheduledCallLead of scheduledCallsLeads) {
        try {
           
          const callResult = await this.retellAiService.makeCall(
            this.configService.get<string>('FROM_PHONE_NUMBER'),
            scheduledCallLead.phone,
            scheduledCallLead.id,
            this.configService.get<string>('AGENT_ID'),
          );
          
          await this.leadsService.updateLeadCallHistory(scheduledCallLead.id, {
            ...callResult,
            fromNumber:this.configService.get<string>('FROM_PHONE_NUMBER'),
            toNumber:scheduledCallLead.phone,
            agent_id: callResult.agent_id
          })
         
         } 
        catch (error) {
          this.logger.error(
            `Failed to process scheduled scheduledCall ${scheduledCallLead.id}: ${error.message}`,
            error.stack,
          );

          
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing scheduled calls: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledCalls() {
    try {
      const now = new Date();
      
      // Find all pending calls that are within their time window
      const scheduledCalls = await this.scheduledCallRepository.find({
        where: [
          {
            startTime: LessThanOrEqual(now),
            // We don't exclude calls with endTime < now here because we check inside loop
          },
        ],
      });

      this.logger.log(`Found ${scheduledCalls.length} calls to process`);

      for (const scheduledCall of scheduledCalls) {
        try {
            const leads = await this.leadsService.findAllWithScheduledCalls()
          // Make the scheduledCall using RetellAI
        for(const lead of leads){
          if (scheduledCall.endTime && scheduledCall.endTime < new Date()) {
            this.logger.log(`End time passed for scheduledCall ${scheduledCall.id}, stopping calls.`);
            break;
          }
          const callResult = await this.retellAiService.makeCall(
            this.configService.get<string>('FROM_PHONE_NUMBER'),
           lead.phone,
            lead.id,
            this.configService.get<string>('AGENT_ID'),
          );
          await this.leadsService.updateLeadCallHistory(lead.id, {
            ...callResult,
            fromNumber:this.configService.get<string>('FROM_PHONE_NUMBER'),
            toNumber:lead.phone,
            agent_id: scheduledCall.overrideAgentId
          })
         
         }

         await this.scheduledCallRepository.softRemove(scheduledCall);
    
          // Add a small delay between calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          this.logger.error(
            `Failed to process scheduled scheduledCall ${scheduledCall.id}: ${error.message}`,
            error.stack,
          );

          
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing scheduled calls: ${error.message}`,
        error.stack,
      );
    }
  }

  async getScheduledCalls(filters?: {
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    startDate?: Date;
    endDate?: Date;
  }) {
    const query = this.scheduledCallRepository.createQueryBuilder('scheduledCall')
      .leftJoinAndSelect('scheduledCall.lead', 'lead');

    if (filters?.status) {
      query.andWhere('scheduledCall.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('scheduledCall.startTime BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return query.getMany();
  }

  async cancelScheduledCall(id: string): Promise<ScheduledCall> {
    const scheduledCall = await this.scheduledCallRepository.findOne({
      where: { id },
    });

    if (!scheduledCall) {
      throw new Error('Scheduled call not found');
    }

    // scheduledCall.status = 'cancelled';
    return this.scheduledCallRepository.save(scheduledCall);
  }
} 