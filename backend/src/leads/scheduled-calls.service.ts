import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledCall } from './entities/scheduled-call.entity';
import { RetellAiService } from './retell-ai.service';
import { LeadsService } from './leads.service';
import { ConfigService } from '@nestjs/config';
import { CronSettingsService } from '../cron-settings/cron-settings.service';
import { JobName } from 'src/cron-settings/enums/job-name.enum';

@Injectable()
export class ScheduledCallsService {
  private readonly logger = new Logger(ScheduledCallsService.name);

  constructor(
    @InjectRepository(ScheduledCall)
    private scheduledCallRepository: Repository<ScheduledCall>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RetellAiService))
    private retellAiService: RetellAiService,
    @Inject(forwardRef(() => LeadsService))
    private leadsService: LeadsService,
    @Inject(forwardRef(() => CronSettingsService))
    private cronSettingsService: CronSettingsService,
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
  async handleIndivitualReScheduledCall() {
    try {
    console.log("running====================")
      // Find all pending calls that are within their time window
      const scheduledCallsLeads = await this.leadsService.findAllWithIndivitualScheduledCalls()

      this.logger.log(`Found ${scheduledCallsLeads.length} calls to process`);

      if (scheduledCallsLeads.length > 0) {
        // Update RetellAI LLM prompt once for this batch of calls
        try {
          // await this.leadsService.updateLeadsScheduledCallbackDate()
          await this.retellAiService.updateLLMPromptForCronJob(JobName.RESCHEDULE_CALL);
          this.logger.log('Updated RetellAI LLM prompt for rescheduled calls');
        } catch (error) {
          this.logger.error(`Failed to update LLM prompt: ${error.message}`);
        }
      }

      for (const scheduledCallLead of scheduledCallsLeads) {
        try {
          await this.leadsService.updateLeadsScheduledCallbackDate(scheduledCallLead.id, {
            scheduledCallbackDate: null,
          })
          const callResult = await this.retellAiService.makeCall(
            this.configService.get<string>('FROM_PHONE_NUMBER'),
            scheduledCallLead.phone,
            scheduledCallLead.id,
            JobName.RESCHEDULE_CALL,
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

  // @Cron(CronExpression.EVERY_MINUTE)
  // async handleScheduledCalls() {
  //   try {
  //     const now = new Date();
      
  //     // Find all pending calls that are within their time window
  //     const scheduledCalls = await this.scheduledCallRepository.find({
  //       where: [
  //         {
  //           startTime: LessThanOrEqual(now),
  //           // We don't exclude calls with endTime < now here because we check inside loop
  //         },
  //       ],
  //     });

  //     this.logger.log(`Found ${scheduledCalls.length} calls to process`);

  //     if (scheduledCalls.length > 0) {
  //       // Update RetellAI LLM prompt once for this batch of calls
  //       try {
  //         await this.retellAiService.updateLLMPromptForCronJob(JobName.SCHEDULED_CALLS);
  //         this.logger.log('Updated RetellAI LLM prompt for scheduled calls');
  //       } catch (error) {
  //         this.logger.error(`Failed to update LLM prompt: ${error.message}`);
  //       }
  //     }

  //     for (const scheduledCall of scheduledCalls) {
  //       try {
  //           const leads = await this.leadsService.findAllWithScheduledCalls()
  //         // Make the scheduledCall using RetellAI
  //       for(const lead of leads){
  //         if (scheduledCall.endTime && scheduledCall.endTime < new Date()) {
  //           this.logger.log(`End time passed for scheduledCall ${scheduledCall.id}, stopping calls.`);
  //           break;
  //         }
  //         if(lead.phone){
  //         const callResult = await this.retellAiService.makeCall(
  //           this.configService.get<string>('FROM_PHONE_NUMBER'),
  //          lead.phone,
  //           lead.id,
  //           "scheduled",
  //           this.configService.get<string>('AGENT_ID'),
  //         );
  //         await this.leadsService.updateLeadCallHistory(lead.id, {
  //           ...callResult,
  //           fromNumber:this.configService.get<string>('FROM_PHONE_NUMBER'),
  //           toNumber:lead.phone,
  //           agent_id: scheduledCall.overrideAgentId
  //         })
         
  //        }

  //        await this.scheduledCallRepository.softRemove(scheduledCall);
    
  //      }   // Add a small delay between calls to avoid rate limiting
  //         await new Promise(resolve => setTimeout(resolve, 500));
  //       } catch (error) {
  //         this.logger.error(
  //           `Failed to process scheduled scheduledCall ${scheduledCall.id}: ${error.message}`,
  //           error.stack,
  //         );

          
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.error(
  //       `Error processing scheduled calls: ${error.message}`,
  //       error.stack,
  //     );
  //   }
  // }


  // @Cron(CronExpression.EVERY_MINUTE)
  async handleDailyScheduledCalls() {
    try {
      const scheduleCalls = await this.cronSettingsService.getByName(JobName.SCHEDULED_CALLS);
      
      if (!scheduleCalls?.isEnabled || !scheduleCalls?.startTime) {
        return; // Job is not enabled or has no start time
      }

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // Get current time in HH:MM format
      const startTime = scheduleCalls.startTime;
      const endTime = scheduleCalls.endTime;

      // Check if current time matches the schedule
      let shouldRun = false;
      if (endTime) {
        // If end time is specified, check if current time is within the window
        shouldRun = currentTime >= startTime && currentTime <= endTime;
      } else {
        // If no end time, check if current time matches start time (within 1 minute)
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        shouldRun = Math.abs(currentMinutes - startTotalMinutes) <= 1;
      }

      this.logger.log(`Daily calls - Current time: ${currentTime}, Schedule: ${startTime}${endTime ? ` - ${endTime}` : ''}, Should run: ${shouldRun}`);
      
      if (shouldRun) {
        const leads = await this.leadsService.findAllWithScheduledCalls();
        this.logger.log(`Found ${leads.length} leads for daily calling`);

        if (leads.length > 0) {
          // Update RetellAI LLM prompt once for this batch of calls
          try {
            await this.retellAiService.updateLLMPromptForCronJob(JobName.SCHEDULED_CALLS);
            this.logger.log('Updated RetellAI LLM prompt for daily scheduled calls');
          } catch (error) {
            this.logger.error(`Failed to update LLM prompt: ${error.message}`);
          }
        }

        for (const lead of leads) {
          try {
            if (lead.phone) {
              const callResult = await this.retellAiService.makeCall(
                this.configService.get<string>('FROM_PHONE_NUMBER'),
                lead.phone,
                lead.id,
               JobName.SCHEDULED_CALLS,
                this.configService.get<string>('AGENT_ID'),
              );
              
              await this.leadsService.updateLeadCallHistory(lead.id, {
                ...callResult,
                fromNumber: this.configService.get<string>('FROM_PHONE_NUMBER'),
                toNumber: lead.phone,
                agent_id: callResult.agent_id
              });
            }
          } catch (error) {
            this.logger.error(
              `Failed to process daily scheduled call for lead ${lead.id}: ${error.message}`,
              error.stack,
            );
          }
          
          // Add a small delay between calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing daily scheduled calls: ${error.message}`,
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

  async handleRescheduleCalls() {
    try {
      const now = new Date();
      
      // Find leads that need rescheduling (those who didn't pick up)
      const leads = await this.leadsService.findLeadsForReschedule();
      
      this.logger.log(`Found ${leads.length} leads to reschedule`);

      if (leads.length > 0) {
        try {
          await this.retellAiService.updateLLMPromptForCronJob(JobName.RESCHEDULE_CALL);
          this.logger.log('Updated RetellAI LLM prompt for rescheduled calls');
        } catch (error) {
          this.logger.error(`Failed to update LLM prompt: ${error.message}`);
        }
      }

      for (const lead of leads) {
        try {
          if (lead.phone) {
            const callResult = await this.retellAiService.makeCall(
              this.configService.get<string>('FROM_PHONE_NUMBER'),
              lead.phone,
              lead.id,
              JobName.RESCHEDULE_CALL,
              this.configService.get<string>('AGENT_ID'),
            );
            
            await this.leadsService.updateLeadCallHistory(lead.id, {
              ...callResult,
              fromNumber: this.configService.get<string>('FROM_PHONE_NUMBER'),
              toNumber: lead.phone,
              callType: 'reschedule'
            });
          }
          
          // Add a small delay between calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          this.logger.error(
            `Failed to process reschedule call for lead ${lead.id}: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing reschedule calls: ${error.message}`,
        error.stack,
      );
    }
  }

  async handleReminderCalls() {
    try {
      const now = new Date();
      
      // Find leads that need reminders (haven't completed form or clicked link)
      const leads = await this.leadsService.findLeadsForReminder();
      
      this.logger.log(`Found ${leads.length} leads for reminder calls`);

      if (leads.length > 0) {
        try {
          await this.retellAiService.updateLLMPromptForCronJob(JobName.REMINDER_CALL);
          this.logger.log('Updated RetellAI LLM prompt for reminder calls');
        } catch (error) {
          this.logger.error(`Failed to update LLM prompt: ${error.message}`);
        }
      }

      for (const lead of leads) {
        try {
          if (lead.phone) {
            const callResult = await this.retellAiService.makeCall(
              this.configService.get<string>('FROM_PHONE_NUMBER'),
              lead.phone,
              lead.id,
              JobName.REMINDER_CALL,
              this.configService.get<string>('AGENT_ID'),
            );
            
            await this.leadsService.updateLeadCallHistory(lead.id, {
              ...callResult,
              fromNumber: this.configService.get<string>('FROM_PHONE_NUMBER'),
              toNumber: lead.phone,
              callType: 'reminder'
            });
          }
          
          // Add a small delay between calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          this.logger.error(
            `Failed to process reminder call for lead ${lead.id}: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing reminder calls: ${error.message}`,
        error.stack,
      );
    }
  }
} 