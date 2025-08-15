import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RetellAiService } from './retell-ai.service';
import { LeadsService } from './leads.service';
import { ConfigService } from '@nestjs/config';
import { CronSettingsService } from '../cron-settings/cron-settings.service';
import { JobName } from 'src/cron-settings/enums/job-name.enum';
import {  isSameDate } from 'src/utils/business-day.util';
import { LeadCallsService } from 'src/lead_calls/lead_calls.service';
import { getRandomValueFromEnv } from 'src/common';
import { LeadCall } from 'src/lead_calls/entities/lead_call.entity';

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
    private leadCallService: LeadCallsService,
   
 
  ) {}


  private async makeCall(lead: any,fromNumber: string) {

    return this.retellAiService.makeCallLeadZoho(
      lead,
      fromNumber,
      lead.lead_formSubmitted,
      lead.lead_linkClicked,
      this.configService.get<string>('AGENT_ID')
    );
  }

  private shouldRunSchedule(currentTime: string, startTime: string, endTime: string | null): boolean {
    if (endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    }
  
    // No end time specified, check if the current time is within 1 minute of the start time
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    return Math.abs(currentMinutes - startTotalMinutes) <= 1;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleReminderCall() {
      const callReminder = await this.cronSettingsService.getByName(JobName.REMINDER_CALL);
      if (!callReminder?.isEnabled || !callReminder?.startTime) {
          this.logger.log('ReminderCall job is not enabled or has no start time');
          return;
      }
  
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // Get current time in HH:MM format
      const { startTime, endTime } = callReminder;
      const startDate = new Date(`1970-01-01T${startTime}:00Z`); // Use UTC time by appending 'Z'
      const endDate = new Date(`1970-01-01T${endTime}:00Z`);
      
      // Calculate the difference in milliseconds
      const timeDifferenceInMillis = endDate.getTime() - startDate.getTime();
      
      // Convert milliseconds to hours
      const timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours
      const shouldRun = this.shouldRunSchedule(currentTime, startTime, endTime);
      if (!shouldRun) {
          return;
      }
      const leadCall = await this.leadCallService.getAllLeadCalls();
      const numberOfCallAvailable=Number(callReminder.callLimit) - Number(leadCall?.reminderCallCount??0)
      if(numberOfCallAvailable<1){
        return
      }
      const timePerCall = Math.floor(numberOfCallAvailable /timeDifferenceInHours)
      this.logger.log(`Time available per call: ${timePerCall.toFixed(2)} hours`);
    
      
      const leads = await this.leadsService.fetchLeadsForCallReminder(timePerCall);
      this.logger.log("Processing leads:", leads.length);
  
      const getNumber = this.configService.get<string>('FROM_PHONE_NUMBER');
      const fromNumber = getRandomValueFromEnv(getNumber);
  
      // Set to track unique leads that have already been processed
      const processedLeads = new Set<string>();
  
      for (const lead of leads) {
          try {
              // Skip processing if this lead has already been processed
              if (processedLeads.has(lead.lead_id)) {
                  this.logger.log(`Skipping lead ${lead.lead_id} as it has already been processed.`);
                  continue;
              }
  
              // Add the lead ID to the Set
              processedLeads.add(lead.lead_id);
  
              const callResult = await this.makeCall(lead, fromNumber);
              
              await this.leadsService.updateLeadCallHistory(lead.lead_id, {
                  ...callResult,
                  fromNumber,
                  toNumber: lead.phone,
                  agent_id: callResult.agent_id,
              },"calling");
                await this.leadsService.update(lead.lead_id, {jobType: JobName.REMINDER_CALL});
          } catch (error) {
              this.logger.error(`Error in Zoho sync: ${error.message}`);
          }
      }
  }
  

  @Cron(CronExpression.EVERY_HOUR)
  async handleIndivitualReScheduledCall() {
    try {
      const reScheduleCalls = await this.cronSettingsService.getByName(JobName.RESCHEDULE_CALL);
  
      if (!reScheduleCalls?.isEnabled || !reScheduleCalls?.startTime) {
        return; // Job is not enabled or has no start time
      }
      const leadCall = await this.leadCallService.getAllLeadCalls();
     
      // Check if today's run date is today's date
        // Proceed with the job logic
        await this.handleRescheduledCalls(reScheduleCalls,leadCall);
       
  
    } catch (error) {
      this.logger.error(`Error processing rescheduled calls: ${error.message}`, error.stack);
    }
  }
  

  
  // Helper function to handle the rescheduled calls
  private async handleRescheduledCalls(reScheduleCalls: any,leadCall: LeadCall) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Get current time in HH:MM format
    const { startTime, endTime } = reScheduleCalls;
    const startDate = new Date(`1970-01-01T${startTime}:00Z`); // Use UTC time by appending 'Z'
    const endDate = new Date(`1970-01-01T${endTime}:00Z`);
    
    // Calculate the difference in milliseconds
    const timeDifferenceInMillis = endDate.getTime() - startDate.getTime();
    
    // Convert milliseconds to hours
    const timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours
    
   
    // Check if current time is within the scheduled window
    const shouldRun = this.isTimeWithinWindow(startTime, endTime, currentTime);
    const numberOfCallAvailable=Number(reScheduleCalls.callLimit) - Number(leadCall?.rescheduledCallCount??0)

    if(numberOfCallAvailable<1){
      return
    }
    
     const timePerCall = Math.floor(numberOfCallAvailable /timeDifferenceInHours)
        this.logger.log(`Time available per call: ${timePerCall.toFixed(2)} hours`);
    
    
    if (shouldRun) {
      this.logger.log(`Running rescheduled calls at ${currentTime}`);
  
      // Fetch leads for rescheduled calls
      const scheduledCallsLeads = await this.leadsService.findAllWithIndivitualScheduledCalls(timePerCall);
      this.logger.log(`Found ${scheduledCallsLeads.length} leads for rescheduled calls`);
  
      if (scheduledCallsLeads.length > 0) {
        try {
          // Update RetellAI LLM prompt once for this batch of calls
          await this.retellAiService.updateLLMPromptForCronJob(JobName.RESCHEDULE_CALL);
          this.logger.log('Updated RetellAI LLM prompt for rescheduled calls');
        } catch (error) {
          this.logger.error(`Failed to update LLM prompt: ${error.message}`);
        }
  
        // Iterate over each lead and make calls
        for (const scheduledCallLead of scheduledCallsLeads) {
          await this.makeRescheduledCall(scheduledCallLead, reScheduleCalls);
        }
      }
    } else {
      this.logger.log(`Not the scheduled time for rescheduled calls. Current time: ${currentTime}, Schedule: ${startTime} - ${endTime || 'No end time'}`);
    }
  }
  
  // Helper function to check if the current time is within the scheduled window
  private isTimeWithinWindow(startTime: string, endTime: string | undefined, currentTime: string): boolean {
    if (endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      return Math.abs(currentMinutes - startTotalMinutes) <= 1;
    }
  }
  
  // Helper function to process the rescheduled call for a lead
  private async makeRescheduledCall(scheduledCallLead: any, reScheduleCalls: any) {
    try {
      const leadCall = await this.leadCallService.getAllLeadCalls();
     if(leadCall){
      if (leadCall.scheduledCallCount >= reScheduleCalls.callLimit) {
        this.logger.log(`Lead ${scheduledCallLead.id} has reached the call limit.`);
        return; // Skip this lead if the call limit is reached
      }
    }
    const getNumber =  this.configService.get<string>('FROM_PHONE_NUMBER');
      const fromNumber = getRandomValueFromEnv(getNumber);
   
      // Make the call to the lead
      const callResult = await this.retellAiService.makeCall(
        fromNumber,
         scheduledCallLead.phone,
        scheduledCallLead.id,
        JobName.RESCHEDULE_CALL,
        this.configService.get<string>('AGENT_ID'),
      );
  
  
      // Update lead call count and call history
      await this.leadsService.updateLeadCallHistory(scheduledCallLead.id, {
        ...callResult,
        fromNumber:fromNumber,
        toNumber: scheduledCallLead.phone,
        agent_id: callResult.agent_id,
      },"calling");
      await this.leadsService.update(scheduledCallLead.id, {jobType: JobName.RESCHEDULE_CALL});
  
    } catch (error) {
      this.logger.error(`Failed to process rescheduled call for lead ${scheduledCallLead.id}: ${error.message}`, error.stack);
    }
  
    // Add a small delay between calls to avoid rate-limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  

 

  @Cron(CronExpression.EVERY_HOUR)
  async handleDailyScheduledCalls() {
    try {
      // Fetch the schedule configuration
      const scheduleCalls = await this.cronSettingsService.getByName(JobName.SCHEDULED_CALLS);
  
      // Check if the schedule job is enabled and has a valid start time
      if (!scheduleCalls?.isEnabled || !scheduleCalls?.startTime) {
        this.logger.log('Scheduled calls job is either disabled or lacks a start time.');
        return; 
      }
      const leadCall = await this.leadCallService.getAllLeadCalls();
      // Check if today's run date is equal to the current date
        await this.handleScheduledCalls(scheduleCalls,leadCall);
    } catch (error) {
      this.logger.error(`Error processing daily scheduled calls: ${error.message}`, error.stack);
    }
  }
  

  
  // Helper function to check if the job should run based on time
  private shouldRun(startTime: string, endTime?: string): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Current time in HH:MM format
  
    if (endTime) {
      // If end time is specified, check if the current time is within the window
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // If no end time, check if current time matches start time (within 1 minute)
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      return Math.abs(currentMinutes - startTotalMinutes) <= 1;
    }
  }
  
  // Helper function to handle making calls for the scheduled job
  private async handleScheduledCalls(scheduleCalls: any,leadCall: LeadCall) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Get current time in HH:MM format
    const startTime = scheduleCalls.startTime;
    const endTime = scheduleCalls.endTime;
    const startDate = new Date(`1970-01-01T${startTime}:00Z`); // Use UTC time by appending 'Z'
    const endDate = new Date(`1970-01-01T${endTime}:00Z`);
    
    // Calculate the difference in milliseconds
    const timeDifferenceInMillis = endDate.getTime() - startDate.getTime();
    
    // Convert milliseconds to hours
    const timeDifferenceInHours = timeDifferenceInMillis / (1000 * 60 * 60); // Convert to hours
    
    // Check if current time is within the scheduled time window
    const shouldRun = this.shouldRun(startTime, endTime);
  
    if (!shouldRun) {
      this.logger.log(`Not the scheduled time for calls. Current time: ${currentTime}, Schedule: ${startTime} - ${endTime || 'No end time'}`);
      return; // Exit if the current time doesn't match the schedule
    }
  
    this.logger.log(`Scheduled calls should run. Current time: ${currentTime}, Schedule: ${startTime} - ${endTime || 'No end time'}`);
  const numberOfCallAvailable=Number(scheduleCalls.callLimit) - Number(leadCall?.scheduledCallCount??0)

if(numberOfCallAvailable<1){
  return
}

 const timePerCall = Math.floor(numberOfCallAvailable /timeDifferenceInHours)
    this.logger.log(`Time available per call: ${timePerCall.toFixed(2)} hours`);


  // Fetch leads to process
    const leads = await this.leadsService.findAllWithScheduledCalls(timePerCall);
    this.logger.log(`Found ${leads.length} leads for daily calling`);
  
    if (leads.length > 0) {
      // Update LLM prompt for this batch of calls
      try {
        await this.retellAiService.updateLLMPromptForCronJob(JobName.SCHEDULED_CALLS);
        this.logger.log('Updated RetellAI LLM prompt for scheduled calls');
      } catch (error) {
        this.logger.error(`Failed to update LLM prompt: ${error.message}`);
      }
  
      // Make calls for each lead
      for (const lead of leads) {
        try {
          if (lead.phone) {
            const leadCall = await this.leadCallService.getAllLeadCalls();
  
            // Check if call limit is reached for scheduled calls
          if(leadCall){
            if (leadCall.scheduledCallCount >= scheduleCalls.callLimit) {
              this.logger.log(`Lead ${lead.id} has reached the call limit.`);
              break; // Stop processing further leads if call limit is reached
            }}
  
            const getNumber =  this.configService.get<string>('FROM_PHONE_NUMBER');
            const fromNumber = getRandomValueFromEnv(getNumber);
         
            // Make the call
            const callResult = await this.retellAiService.makeCall(
              fromNumber,
              lead.phone,
              lead.id,
              JobName.SCHEDULED_CALLS,
              this.configService.get<string>('AGENT_ID'),
            );
  
        
            await this.leadsService.updateLeadCallHistory(lead.id, {
              ...callResult,
              fromNumber: fromNumber,
              toNumber: lead.phone,
              agent_id: callResult.agent_id,
            },"calling");
            await this.leadsService.update(lead.id, {jobType: JobName.SCHEDULED_CALLS});
          }
        } catch (error) {
          this.logger.error(`Failed to process daily scheduled call for lead ${lead.id}: ${error.message}`, error.stack);
        }
  
        // Add a delay to avoid rate-limiting issues
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  

} 