import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RetellAiService } from './retell-ai.service';
import { LeadsService } from './leads.service';
import { ConfigService } from '@nestjs/config';
import { CronSettingsService } from '../cron-settings/cron-settings.service';
import { JobName } from 'src/cron-settings/enums/job-name.enum';
import { addBusinessDays, isSameDate } from 'src/utils/business-day.util';

@Injectable()
export class ScheduledCallsService {
  private readonly logger = new Logger(ScheduledCallsService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RetellAiService))
    private retellAiService: RetellAiService,
    @Inject(forwardRef(() => LeadsService))
    private leadsService: LeadsService,
    @Inject(forwardRef(() => CronSettingsService))
    private cronSettingsService: CronSettingsService,
  ) {}





  @Cron(CronExpression.EVERY_MINUTE)
  async handleIndivitualReScheduledCall() {
    try {
      const reScheduleCalls = await this.cronSettingsService.getByName(JobName.RESCHEDULE_CALL);
      
      if (!reScheduleCalls?.isEnabled || !reScheduleCalls?.startTime) {
        return; // Job is not enabled or has no start time
      }
      
      if(!reScheduleCalls.runDate){
        const runDate = new Date();
        reScheduleCalls.runDate = addBusinessDays(runDate, +reScheduleCalls.selectedDays); // Next business day
        await this.cronSettingsService.update(JobName.SCHEDULED_CALLS, reScheduleCalls);
        }
      
      if (reScheduleCalls.runDate && isSameDate(new Date(reScheduleCalls.runDate), new Date())) {
      
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // Get current time in HH:MM format
        const startTime = reScheduleCalls.startTime;
        const endTime = reScheduleCalls.endTime;
        
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
        
        if(shouldRun){
    console.log("running====================")
      // Find all pending calls that are within their time window
      const scheduledCallsLeads = await this.leadsService.findAllWithIndivitualScheduledCalls()

      this.logger.log(`Found ${scheduledCallsLeads.length} calls to process`);

      if (scheduledCallsLeads.length > 0) {
        // Update RetellAI LLM prompt once for this batch of calls
        try {
        
          await this.retellAiService.updateLLMPromptForCronJob(JobName.RESCHEDULE_CALL);
          this.logger.log('Updated RetellAI LLM prompt for rescheduled calls');
        } catch (error) {
          this.logger.error(`Failed to update LLM prompt: ${error.message}`);
        }
      }

      for (const scheduledCallLead of scheduledCallsLeads) {
        try {
           
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
    }
    else{
      const runDate = new Date();
      reScheduleCalls.runDate = addBusinessDays(runDate, +reScheduleCalls.selectedDays); // Next business day
      await this.cronSettingsService.update(JobName.RESCHEDULE_CALL, reScheduleCalls);
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
  async handleDailyScheduledCalls() {
    try {
      const scheduleCalls = await this.cronSettingsService.getByName(JobName.SCHEDULED_CALLS);
      
      if (!scheduleCalls?.isEnabled || !scheduleCalls?.startTime) {
        return; // Job is not enabled or has no start time
      }
if(!scheduleCalls.runDate){
  const runDate = new Date();
  scheduleCalls.runDate = addBusinessDays(runDate, +scheduleCalls.selectedDays); // Next business day
  await this.cronSettingsService.update(JobName.SCHEDULED_CALLS, scheduleCalls);
  }

if (scheduleCalls.runDate && isSameDate(new Date(scheduleCalls.runDate), new Date())) {

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
      else{
      
const runDate = new Date();
scheduleCalls.runDate = addBusinessDays(runDate, +scheduleCalls.selectedDays); // Next business day
await this.cronSettingsService.update(JobName.SCHEDULED_CALLS, scheduleCalls);
 }
    }
    } catch (error) {
      this.logger.error(
        `Error processing daily scheduled calls: ${error.message}`,
        error.stack,
      );
    }
  }

  // async handleRescheduleCalls() {
  //   try {
  //     const now = new Date();
      
  //     // Find leads that need rescheduling (those who didn't pick up)
  //     const leads = await this.leadsService.findLeadsForReschedule();
      
  //     this.logger.log(`Found ${leads.length} leads to reschedule`);

  //     if (leads.length > 0) {
  //       try {
  //         await this.retellAiService.updateLLMPromptForCronJob(JobName.RESCHEDULE_CALL);
  //         this.logger.log('Updated RetellAI LLM prompt for rescheduled calls');
  //       } catch (error) {
  //         this.logger.error(`Failed to update LLM prompt: ${error.message}`);
  //       }
  //     }

  //     for (const lead of leads) {
  //       try {
  //         if (lead.phone) {
  //           const callResult = await this.retellAiService.makeCall(
  //             this.configService.get<string>('FROM_PHONE_NUMBER'),
  //             lead.phone,
  //             lead.id,
  //             JobName.RESCHEDULE_CALL,
  //             this.configService.get<string>('AGENT_ID'),
  //           );
            
  //           await this.leadsService.updateLeadCallHistory(lead.id, {
  //             ...callResult,
  //             fromNumber: this.configService.get<string>('FROM_PHONE_NUMBER'),
  //             toNumber: lead.phone,
  //             callType: 'reschedule'
  //           });
  //         }
          
  //         // Add a small delay between calls to avoid rate limiting
  //         await new Promise(resolve => setTimeout(resolve, 500));
  //       } catch (error) {
  //         this.logger.error(
  //           `Failed to process reschedule call for lead ${lead.id}: ${error.message}`,
  //           error.stack,
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.error(
  //       `Error processing reschedule calls: ${error.message}`,
  //       error.stack,
  //     );
  //   }
  // }

  // async handleReminderCalls() {
  //   try {
  //     const now = new Date();
      
  //     // Find leads that need reminders (haven't completed form or clicked link)
  //     const leads = await this.leadsService.findLeadsForReminder();
      
  //     this.logger.log(`Found ${leads.length} leads for reminder calls`);

  //     if (leads.length > 0) {
  //       try {
  //         await this.retellAiService.updateLLMPromptForCronJob(JobName.REMINDER_CALL);
  //         this.logger.log('Updated RetellAI LLM prompt for reminder calls');
  //       } catch (error) {
  //         this.logger.error(`Failed to update LLM prompt: ${error.message}`);
  //       }
  //     }

  //     for (const lead of leads) {
  //       try {
  //         if (lead.phone) {
  //           const callResult = await this.retellAiService.makeCall(
  //             this.configService.get<string>('FROM_PHONE_NUMBER'),
  //             lead.phone,
  //             lead.id,
  //             JobName.REMINDER_CALL,
  //             this.configService.get<string>('AGENT_ID'),
  //           );
            
  //           await this.leadsService.updateLeadCallHistory(lead.id, {
  //             ...callResult,
  //             fromNumber: this.configService.get<string>('FROM_PHONE_NUMBER'),
  //             toNumber: lead.phone,
  //             callType: 'reminder'
  //           });
  //         }
          
  //         // Add a small delay between calls to avoid rate limiting
  //         await new Promise(resolve => setTimeout(resolve, 500));
  //       } catch (error) {
  //         this.logger.error(
  //           `Failed to process reminder call for lead ${lead.id}: ${error.message}`,
  //           error.stack,
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.error(
  //       `Error processing reminder calls: ${error.message}`,
  //       error.stack,
  //     );
  //   }
  // }
} 