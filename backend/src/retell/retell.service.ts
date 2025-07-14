import { Injectable, Logger, Inject, forwardRef, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallHistory } from '../leads/entities/call-history.entity';
import { Lead } from '../leads/entities/lead.entity';
import { CallTranscript } from './entities/call-transcript.entity';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { MailService } from 'src/mail/mail.service';
import { SmsService } from 'src/sms/sms.service';
import { JwtService } from '@nestjs/jwt';
import { transcription } from 'src/constant';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CronSettingsService } from 'src/cron-settings/cron-settings.service';
import { Retell } from './entities/retell.entity';
import { JobName } from 'src/cron-settings/enums/job-name.enum';

@Injectable()
export class RetellService {
  private readonly logger = new Logger(RetellService.name);
  private openai: ChatOpenAI;
  private readonly retellApiKey: string;
  private readonly retellBaseUrl = 'https://api.retellai.com';
  private processedCallsTimestamps: Map<string, number> = new Map();  // Store timestamps for each lead

  constructor(
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(CallTranscript)
    private callTranscriptRepository: Repository<CallTranscript>,
    private mailService: MailService,
    private smsService: SmsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cronSettingService: CronSettingsService,
   @InjectRepository(Retell)
private retellRepository: Repository<Retell>
  ) {
    this.openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
      modelName: 'gpt-4'
    });
    this.retellApiKey = this.configService.get<string>('RETELL_AI_API_KEY');
  }

  /**
   * Handle call_started webhook event
   */
  async handleCallStarted(call: any): Promise<void> {
    try {
      this.logger.log(`Call started: ${call.call_id}`);
      
      // Find lead information from the call metadata
      const leadId = this.extractLeadId(call);
      if (!leadId) {
        this.logger.warn(`No lead ID found for call ${call.call_id}`);
        return;
      }

      // Create initial call history record
      await this.createOrUpdateCallHistory(call, leadId, 'ongoing');
    } catch (error) {
      this.logger.error(`Error handling call_started event: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle call_ended webhook event
   */
  async handleCallEnded(call: any): Promise<void> {
    try {
      this.logger.log(`Call ended: ${call.call_id}`);
      
      // Find lead information from the call metadata
      const leadId = this.extractLeadId(call);
      if (!leadId) {
        this.logger.warn(`No lead ID found for call ${call.call_id}`);
        return;
      }

      const currentTimestamp = Date.now();
      const lastProcessedTimestamp = this.processedCallsTimestamps.get(leadId);

      if (lastProcessedTimestamp && currentTimestamp - lastProcessedTimestamp < 80000) {
        this.logger.log(`Call for lead ${leadId} is within the 80-second window. Skipping.`);
        return; // Skip if within the 80 seconds window
      }
      
      this.logger.log(`Call ended: ${call.call_id}`);

      // Update the processed timestamp for the lead
      this.processedCallsTimestamps.set(leadId, currentTimestamp);


      // Update call history with ended status and transcript
      const callHistory = await this.createOrUpdateCallHistory(call, leadId, 'ended');

      // Store the transcript
      await this.storeTranscript(call, callHistory.id);

      // Process transcript for email or phone information
      await this.processTranscriptForContactInfo(call, leadId);
    } catch (error) {
      this.logger.error(`Error handling call_ended event: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle call_analyzed webhook event
   */
  async handleCallAnalyzed(call: any): Promise<void> {
    try {
      this.logger.log(`Call analyzed: ${call.call_id}`);
      
      // Find lead information from the call metadata
      const leadId = this.extractLeadId(call);
      if (!leadId) {
        this.logger.warn(`No lead ID found for call ${call.call_id}`);
        return;
      }

      // Update call history with analysis data
      const callHistory = await this.callHistoryRepository.findOne({
        where: { callId: call.call_id }
      });

      if (callHistory) {
        // Store analysis data in call history
        callHistory.sentiment = {
          overall: this.mapSentiment(call.call_analysis?.user_sentiment),
          keyPhrases: [],
          concerns: [],
          interests: []
        };
        
        // Store custom analysis data if available
        const analytics = {
          talkTime: 0,
          silenceTime: 0,
          leadTalkPercentage: 0,
          agentTalkPercentage: 0,
          interruptions: 0,
          ...call.call_analysis?.custom_analysis_data
        };
        
        callHistory.analytics = analytics;
        await this.callHistoryRepository.save(callHistory);
      }

      // Update transcript with analysis data
      await this.updateTranscriptWithAnalysis(call);
    } catch (error) {
      this.logger.error(`Error handling call_analyzed event: ${error.message}`, error.stack);
    }
  }

  /**
   * Create or update call history record
   */
  private async createOrUpdateCallHistory(call: any, leadId: string, status: string): Promise<CallHistory> {
    // Check if call history already exists
    let callHistory = await this.callHistoryRepository.findOne({
      where: { callId: call.call_id }
    });

    if (!callHistory) {
      // Create new call history record
      callHistory = this.callHistoryRepository.create({
        callId: call.call_id,
        callType: call.call_type || 'web_call',
        agentId: call.agent_id,
        status: status,
        startTimestamp: call.start_timestamp,
        fromNumber: call.from_number, // Default value, update if available in call data
        toNumber: call.to_number, // To be filled from lead data if available
        direction: 'outbound',
        lead_id: leadId
      });
    }

    // Update call history record with new data
    if (status === 'ended') {
      callHistory.status = status;
      callHistory.endTimestamp = call.end_timestamp;
      callHistory.duration_ms = call.duration_ms;
      callHistory.disconnection_reason = call.disconnection_reason || '';
      callHistory.latency = call.latency || {};
      callHistory.callCost = call.call_cost || {};
    }

    return await this.callHistoryRepository.save(callHistory);
  }

  /**
   * Store transcript data in CallTranscript entity
   */
  private async storeTranscript(call: any, callHistoryId: string): Promise<CallTranscript> {
    if (!call.transcript) {
      return null;
    }

    // Check if transcript already exists
    let transcript = await this.callTranscriptRepository.findOne({
      where: { callId: call.call_id }
    });

    if (!transcript) {
      // Create new transcript record
      transcript = this.callTranscriptRepository.create({
        callId: call.call_id,
        transcript: call.transcript,
        transcriptObject: call.transcript_object || [],
        transcriptWithToolCalls: call.transcript_with_tool_calls || [],
        recordingUrl: call.recording_url,
        publicLogUrl: call.public_log_url,
        call_history_id: callHistoryId,
        metadata: {
          accessToken: call.access_token,
          optOutSensitiveDataStorage: call.opt_out_sensitive_data_storage,
          optInSignedUrl: call.opt_in_signed_url
        }
      });
    } else {
      // Update existing transcript record
      transcript.transcript = call.transcript;
      transcript.transcriptObject = call.transcript_object || transcript.transcriptObject;
      transcript.transcriptWithToolCalls = call.transcript_with_tool_calls || transcript.transcriptWithToolCalls;
      transcript.recordingUrl = call.recording_url || transcript.recordingUrl;
      transcript.publicLogUrl = call.public_log_url || transcript.publicLogUrl;
    }

    return await this.callTranscriptRepository.save(transcript);
  }

  /**
   * Update transcript with analysis data
   */
  private async updateTranscriptWithAnalysis(call: any): Promise<void> {
    if (!call.call_analysis) {
      return;
    }

    const transcript = await this.callTranscriptRepository.findOne({
      where: { callId: call.call_id }
    });

    if (transcript) {
      transcript.callAnalysis = call.call_analysis;
      await this.callTranscriptRepository.save(transcript);
    }
  }

   private getNextBusinessDay(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // Set to 10 AM
    
    // If tomorrow is weekend, move to Monday
    if (tomorrow.getDay() === 0) { // Sunday
      tomorrow.setDate(tomorrow.getDate() + 1);
    } else if (tomorrow.getDay() === 6) { // Saturday
      tomorrow.setDate(tomorrow.getDate() + 2);
    }
    
    return tomorrow;
  }

  private async getNextScheduleDay(): Promise<Date> {
    const cronSetting = await this.cronSettingService.getByName(JobName.RESCHEDULE_CALL);
    console.log("cronSetting", cronSetting);
    
    if (cronSetting?.startTime) {
      // Parse the time string (HH:MM format) and set it for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const [hours, minutes] = cronSetting.startTime.split(':').map(Number);
      tomorrow.setHours(hours, minutes, 0, 0);
      
      return tomorrow;
    }
    
    return this.getNextBusinessDay();
  }
  /**
   * Process transcript for email or phone information
   */
  private async processTranscriptForContactInfo(call: any, leadId: string): Promise<void> {
    try {
      const lead = await this.leadRepository.findOne({
        where: { id: leadId }
      });

      if (!call.transcript) {
        this.logger.warn(`No transcript found for call ${call.call_id}`);
        lead.scheduledCallbackDate = await this.getNextScheduleDay();
        await this.leadRepository.save(lead);  
        return;
      }

      if (!lead) {
        this.logger.warn(`Lead not found for ID: ${leadId}`);
        return;
      }

      const transcript =
      //  transcription
       call.transcript;

      // Create structured messages for the chat
      const messages = [
        {
          role: "system",
          content: `You are an information extractor. Extract contact information, scheduling details, and busy status from conversations.`
        },
        {
          role: "user",
          content: `Analyze this conversation and extract:
1. The preferred contact method (must be "email", "phone", "both", "schedule", "busy", or "none")
2. The contact information (email address and/or phone number)
3. If scheduling is mentioned, extract the number of days for callback 
4. Convert any specific time mentioned for callback into a 24-hour format (e.g., "6 PM" to "18:00")
5. Resent link
6. Is the person busy or wants to reschedule (look for phrases like "busy", "can't talk", "call back", "another time")
7. If the user says "not interested", include "notInterested: true" in the result

Return ONLY a JSON object with these fields:
- preferredMethod: "email", "phone", "both", "schedule", "busy", or "none"
- contactInfo: {
    email: the email address or null,
    phone: the phone number or null
  }
- scheduleDays: number of days for callback or null
- specificTime: the specific time mentioned for callback in 24-hour format or null
- resentLink: boolean
- isBusy: boolean (true if person indicates they are busy or want to reschedule)
- notInterested: boolean (true if the person indicates they are not interested)
Conversation:
${transcript}`
        }];

      try {
        const response = await this.openai.invoke(messages);
        let contactInfo;
        
        // Get the response text from the message
        const responseText = Array.isArray(response.content) 
          ? response.content
              .map(c => {
                if (typeof c === 'string') return c;
                if ('text' in c) return c.text;
                return '';
              })
              .join('')
          : String(response.content);

        try {
          contactInfo = JSON.parse(responseText);
        } catch (parseError) {
          // If parsing fails, try to extract just the JSON part
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            contactInfo = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse response as JSON');
          }
        }

        // Handle busy/reschedule case first
        if (contactInfo.isBusy || contactInfo.preferredMethod === 'busy') {
          // Get the next available time from cron settings
          const cronSetting = await this.cronSettingService.getByName(JobName.RESCHEDULE_CALL);
          if (cronSetting?.startTime) {
            const scheduleDate = new Date();
            scheduleDate.setDate(scheduleDate.getDate() + 2); // Default to next day if no specific days mentioned
            
            const [hours, minutes] = cronSetting.startTime.split(':').map(Number);
            scheduleDate.setHours(hours, minutes, 0, 0);
            
            // If it's weekend, move to Monday
            if (scheduleDate.getDay() === 0) { // Sunday
              scheduleDate.setDate(scheduleDate.getDate() + 1);
            } else if (scheduleDate.getDay() === 6) { // Saturday
              scheduleDate.setDate(scheduleDate.getDate() + 2);
            }
            
            lead.scheduledCallbackDate = scheduleDate;
            await this.leadRepository.save(lead);
            this.logger.log(`Lead is busy, rescheduled for next available time: ${scheduleDate.toISOString()}`);
            return;
          }
        }

        if (contactInfo.notInterested) {
          lead.notInterested=true
          lead.status='not-interested'
          await this.leadRepository.save(lead)
        }
        if (contactInfo.resentLink) {
          if (lead.zohoEmail) {
            await this.mailService.sendVerificationLink(lead);
            this.logger.log(`Sent verification email to ${lead.zohoEmail}`);
          }
          if (lead.zohoPhoneNumber) {
            await this.smsService.sendVerificationSMS(lead);
            this.logger.log(`Sent verification SMS to ${lead.zohoPhoneNumber}`);
          }
          
          await this.leadRepository.update({id:lead.id},{linkSend:true})
        }

        if (contactInfo.preferredMethod === 'schedule' && contactInfo.scheduleDays) {
          const scheduleDate = new Date();
          scheduleDate.setDate(scheduleDate.getDate() + contactInfo.scheduleDays);
          
          if (contactInfo.specificTime) {
            const [hours, minutes] = contactInfo.specificTime.split(':').map(Number);
            scheduleDate.setHours(hours);
            scheduleDate.setMinutes(minutes);
            scheduleDate.setSeconds(0);
          }

          lead.scheduledCallbackDate = scheduleDate;
          await this.leadRepository.save(lead);
          
          this.logger.log(`Scheduled callback for ${scheduleDate.toISOString()}`);
          return;
        }

        // Handle both email and phone cases
        if (contactInfo.preferredMethod === 'both') {
          if (contactInfo.contactInfo.email) {
            lead.zohoEmail = contactInfo.contactInfo.email;
            await this.mailService.sendVerificationLink(lead);
            this.logger.log(`Sent verification email to ${contactInfo.contactInfo.email}`);
          }
          
          if (contactInfo.contactInfo.phone) {
            lead.zohoPhoneNumber = contactInfo.contactInfo.phone;
            await this.smsService.sendVerificationSMS(lead);
            this.logger.log(`Sent verification SMS to ${contactInfo.contactInfo.phone}`);
          }
          lead.linkSend=true
          await this.leadRepository.save(lead);
        }
        // Handle email only
        else if (contactInfo.preferredMethod === 'email') {
          lead.zohoEmail = contactInfo.contactInfo.email;
          lead.linkSend=true
          await this.leadRepository.save(lead);
          await this.mailService.sendVerificationLink(lead);
          this.logger.log(`Sent verification email to ${contactInfo.contactInfo.email}`);
        } 
        // Handle phone only
        else if (contactInfo.preferredMethod === 'phone') {
          lead.zohoPhoneNumber = contactInfo.contactInfo.phone??lead.phone;
          lead.linkSend=true
          await this.leadRepository.save(lead);
          await this.smsService.sendVerificationSMS(lead);
          this.logger.log(`Sent verification SMS to ${contactInfo.contactInfo.phone}`);
        }
        else {
          // Default rescheduling if no other method specified
          lead.scheduledCallbackDate = await this.getNextScheduleDay();
          await this.leadRepository.save(lead);   
          this.logger.log(`No contact method specified, scheduled callback for next business day: ${lead.scheduledCallbackDate.toISOString()}`);
        }

      } catch (error) {
        this.logger.error(`Error processing transcript: ${error.message}`, error.stack);
        // On error, schedule for next business day
        lead.scheduledCallbackDate = await this.getNextScheduleDay();
        await this.leadRepository.save(lead);
      }
    } catch (error) {
      this.logger.error(`Error in processTranscriptForContactInfo: ${error.message}`, error.stack);
    }
  }

  /**
   * Extract lead ID from call metadata
   */
  private extractLeadId(call: any): string | null {
    // Check metadata for lead_id
    if (call.metadata && call.metadata.lead_id) {
      return call.metadata.lead_id;
    }
    
    // Try to find lead ID in call parameters
    if (call.parameters && call.parameters.lead_id) {
      return call.parameters.lead_id;
    }
    
    // Could also extract from other fields if needed
    
    return null;
  }
  
  /**
   * Clean phone number to standard format
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }
  
  /**
   * Map sentiment from string to enum value
   */
  private mapSentiment(sentiment: string): 'positive' | 'neutral' | 'negative' {
    if (!sentiment) return 'neutral';
    
    const sentimentLower = sentiment.toLowerCase();
    if (sentimentLower.includes('positive')) return 'positive';
    if (sentimentLower.includes('negative')) return 'negative';
    return 'neutral';
  }

  async getRetellLLM(llmId: string) {
    try {
 return this.retellRepository.findOne({where:{llm_id:llmId}})
      // const response = await axios.get(`${this.retellBaseUrl}/get-retell-llm/${llmId}`, {
      //   headers: {
      //     'Authorization': `Bearer ${this.retellApiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // const generalPrompt=response.data.general_prompt  
      // return response.data;
    } catch (error) {
      this.logger.error(`Error getting Retell LLM: ${error.message}`);
      throw new HttpException(
        `Failed to get Retell LLM: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  // async getCronSetting(name: string) {
  //   try {
  //    return this.cronSettingService.getByName(name)
  //   } catch (error) {
  //     this.logger.error(`Error getting Cron Setting LLM: ${error.message}`);
  //     throw new HttpException(
  //       `Failed to get Cron Setting: ${error.message}`,
  //       HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }

  async updateRetellLLM(llmId: string, prompt: any) {
    try {
     const retell = await this.retellRepository.findOne({where:{llm_id:llmId}})
    if(retell){
      retell.masterPrompt = prompt.masterPrompt || '';
      retell.reminderPrompt = prompt.reminderPrompt || '';
      retell.busyPrompt = prompt.busyPrompt || '';
     return  this.retellRepository.save(retell)
    }else{
      const newRetell = new Retell()
      newRetell.masterPrompt = prompt.masterPrompt || '';
      newRetell.reminderPrompt = prompt.reminderPrompt || '';
      newRetell.busyPrompt = prompt.busyPrompt || '';
      newRetell.llm_id = llmId;
      return this.retellRepository.save(newRetell)
    }
    } catch (error) {
      this.logger.error(`Error updating Retell LLM: ${error.message}`);
      throw new HttpException(
        `Failed to update Retell LLM: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCallDetail(callId: string) {
    try {
      // Get call details from Retell API
      const response = await axios.get(`${this.retellBaseUrl}/v2/get-call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.retellApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Get call history to find lead information
      const callHistory = await this.callHistoryRepository.findOne({
        where: { callId },
        relations: ['lead']
      });

      // Combine Retell API data with lead information
      const callDetail = {
        ...response.data,
        lead: callHistory?.lead ? {
          id: callHistory.lead.id,
          firstName: callHistory.lead.firstName,
          lastName: callHistory.lead.lastName,
          phone: callHistory.lead.phone,
          email: callHistory.lead.email,
          status: callHistory.lead.status,
          contacted: callHistory.lead.contacted,
          zohoEmail: callHistory.lead.zohoEmail,
          zohoPhoneNumber: callHistory.lead.zohoPhoneNumber,
          scheduledCallbackDate: callHistory.lead.scheduledCallbackDate,
          company: callHistory.lead.company,
          industry: callHistory.lead.industry,
          linkClicked: callHistory.lead.linkClicked,
          formSubmitted: callHistory.lead.formSubmitted
        } : null
      };
      
      return callDetail;
    } catch (error) {
      this.logger.error(`Error getting call detail: ${error.message}`);
      throw new HttpException(
        `Failed to get call detail: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateLLMPrompt(prompt: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.retellBaseUrl}/v2/update-llm-prompt`,
        { prompt },
        {
          headers: {
            'Authorization': `Bearer ${this.retellApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      this.logger.log('Successfully updated LLM prompt');
      return response.data;
    } catch (error) {
      this.logger.error(`Error updating LLM prompt: ${error.message}`);
      throw new HttpException(
        `Failed to update LLM prompt: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateLLMPromptForCronJob(type: JobName): Promise<void> {
    let prompt = '';
    switch (type) {
      case JobName.SCHEDULED_CALLS:
        prompt = this.configService.get<string>('RETELL_MASTER_PROMPT');
        break;
      case JobName.RESCHEDULE_CALL:
        prompt = this.configService.get<string>('RETELL_RESCHEDULE_PROMPT');
        break;
      case JobName.REMINDER_CALL:
        prompt = this.configService.get<string>('RETELL_REMINDER_PROMPT');
        break;
      default:
        this.logger.warn(`No prompt found for job type: ${type}`);
        return;
    }

    if (!prompt) {
      this.logger.warn(`No prompt configured for job type: ${type}`);
      return;
    }

    try {
      await this.updateLLMPrompt(prompt);
      this.logger.log(`Successfully updated LLM prompt for job type: ${type}`);
    } catch (error) {
      this.logger.error(`Failed to update LLM prompt for job type: ${type}`, error.stack);
      throw error;
    }
  }
}
