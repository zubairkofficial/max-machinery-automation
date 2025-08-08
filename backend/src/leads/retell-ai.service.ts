import { Injectable, Logger, HttpException, HttpStatus, forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';
import { LastCall } from './entities/last-call.entity';
import { ZohoSyncService } from './zoho-sync.service';
import { JobName } from 'src/cron-settings/enums/job-name.enum';
import { ChatOpenAI } from '@langchain/openai';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { CallHistory } from './entities/call-history.entity';
import { CallTranscript } from '../retell/entities/call-transcript.entity';

@Injectable()
export class RetellAiService {
  private readonly logger = new Logger(RetellAiService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly retellBaseUrl: string;
  private readonly openai: ChatOpenAI;

  constructor(
    @Inject(forwardRef(() => LeadsService))
    private leadsService: LeadsService,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(CallHistory)
    private readonly callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(CallTranscript)
    private readonly callTranscriptRepository: Repository<CallTranscript>,
    private readonly configService: ConfigService,
    private readonly zohoSyncService: ZohoSyncService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {
    this.apiKey = this.configService.get<string>('RETELL_AI_API_KEY');
    this.apiUrl = this.configService.get<string>('RETELL_AI_API_URL')+'/v2/create-phone-call';
    this.retellBaseUrl = this.configService.get<string>('RETELL_AI_API_URL');
    this.openai = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      temperature: 0.2,
      modelName: 'gpt-4'
    });
  }

  private async getNextScheduleDay(): Promise<Date> {
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

  /**
   * Makes a phone call using RetellAI API
   */
private async updateRetellLLM(llmId:string, promptType:JobName,lastCallTranscription?:string): Promise<void> {
    const retell = await this.leadsService.getByRetellId(llmId);
    let prompt = '';

    switch (promptType) {
      case JobName.SCHEDULED_CALLS:
        prompt = retell.masterPrompt;
        break;
      case JobName.REMINDER_CALL:
        prompt = retell.reminderPrompt;
        break;
      case JobName.RESCHEDULE_CALL:
        prompt = retell.busyPrompt;
        break;
    }

    try {
      await axios.patch(
        `${this.retellBaseUrl}/update-retell-llm/${llmId}`,
        { general_prompt: prompt },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      throw new HttpException(`Failed to update Retell LLM: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Public method to update RetellAI LLM prompt - called from cron jobs only
   */
  public async updateLLMPromptForCronJob(promptType:JobName, lastCallTranscription?: string): Promise<void> {
    return this.updateRetellLLM(this.configService.get<string>('RETELL_LLM_ID'), promptType, lastCallTranscription);
  }
  public async testMail(lead): Promise<void> {
    try {
      
  return this.smsService.sendVerificationSMS(lead);
    // return this.mailService.sendVerificationLink(lead);
  } catch (error) {
    throw new HttpException(`Failed to send test mail: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
  }

  // Call making method with error handling
  public async makeCall(fromNumber: string, toNumber: string, id: string, type:JobName, overrideAgentId?: string): Promise<any> {
    try {
      if (!this.apiKey) throw new Error('RetellAI API key is not configured');
      if (!toNumber) throw new Error('No phone number provided for the call');

     const lead = await this.leadRepository.findOne({ 
  where: { id },
        relations: ['lastCallRecord']
});

      const cleanFromNumber = this.cleanPhoneNumber(fromNumber);
      const cleanToNumber = this.cleanPhoneNumber(toNumber);

   let lastCallTranscription = '';
if (type===JobName.RESCHEDULE_CALL && lead.lastCallRecord) {
  try {
    const call = await axios.get(
            `${this.retellBaseUrl}/v2/get-call/${lead.lastCallRecord.callId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (call.data.transcript) {
      lastCallTranscription = call.data.transcript;

    }
  } catch (error) {
    this.logger.error(`Error fetching call transcript: ${error.message}`);
  }
}

      // Update Zoho CRM status based on call type
      try {
        // Check if lead exists in Zoho
        let zohoLead = await this.zohoSyncService.searchLeadInZohoByPhone(cleanToNumber);
        
        if (!zohoLead?.Phone) {
          // If this is a first-time call and lead doesn't exist in Zoho, create it
          zohoLead = await this.zohoSyncService.createLeadInZoho({
            firstName: lead.firstName || '',
            lastName: lead.lastName || lead.firstName,
            phone: cleanToNumber,
            email: lead.zohoEmail || '',
            company: lead.company || '',
            industry: lead.industry || '',
            leadStatus: 'Initial Call',
            description: `Lead created during initial call attempt on ${new Date().toISOString()}`
          });
        }

        // Update Zoho lead status based on call type
        const zohoStatus = this.getZohoStatusForCallType(type);
        await this.zohoSyncService.updateLeadInZoho(zohoLead.id, {
          leadStatus: zohoStatus,
          lastCalledAt: new Date().toISOString(),
          callType: type
        });

      } catch (error) {
        this.logger.error(`Error updating Zoho CRM: ${error.message}`);
        // Continue with the call even if Zoho update fails
      }
      let response;
if (type===JobName.RESCHEDULE_CALL && lastCallTranscription) {
   response = await axios.post(
    this.apiUrl,
    {
      from_number: cleanFromNumber,
      to_number: cleanToNumber,
      override_agent_id: overrideAgentId,
      retell_llm_dynamic_variables: {
        lead_name: `${lead.firstName}`,
        follow_up_weeks: "2 weeks",
        consultation_link: "https://machinerymax.com/schedule",
        contact_info: "contact@machinerymax.com | (555) 123-4567",
        lead_phone_number: lead.phone,
        previous_call_transcription: lastCallTranscription,
      },
      metadata: { 
        lead_id: lead.id,
     
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
}else{
      // Make the call via RetellAI API
       response = await axios.post(
        this.apiUrl,
        {
          from_number: cleanFromNumber,
          to_number: cleanToNumber,
          override_agent_id: overrideAgentId,
          retell_llm_dynamic_variables: {
            lead_name: `${lead.firstName}`,
            follow_up_weeks: "2 weeks",
            consultation_link: "https://machinerymax.com/schedule",
            contact_info: "contact@machinerymax.com | (555) 123-4567",
            lead_phone_number: lead.phone,
          },
          metadata: { 
            lead_id: lead.id,
         
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

      // Update lead status
      lead.status = 'CALLING';
      
      await this.leadRepository.save(lead);
      return response.data;
    } catch (error) {
      throw new HttpException(`Failed to make call: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getZohoStatusForCallType(type:JobName): string {
    switch (type) {
      case JobName.SCHEDULED_CALLS:
        return 'Initial Call';
      case JobName.RESCHEDULE_CALL:
        return 'Rescheduled Call';
      case JobName.REMINDER_CALL:
        return 'Reminder Call';
      default:
        return 'Attempted Contact';
    }
  }

  // Lead call reminder handling method
  public async makeCallLeadZoho(lead, fromNumber: string, formSubmit: boolean, linkClick: boolean, overrideAgentId?: string): Promise<any> {
    try {
      if (!this.apiKey) throw new Error('RetellAI API key is not configured');
      if (lead.phone){

      const cleanFromNumber = this.cleanPhoneNumber(fromNumber);
      const cleanToNumber = this.cleanPhoneNumber(lead.phone);

      // Update Zoho CRM status based on call type
      try {
        // Check if lead exists in Zoho
        let zohoLead = await this.zohoSyncService.searchLeadInZohoByPhone(cleanToNumber);
        
       

        // Update Zoho lead status based on form submission and link click
        let status = 'Contact Attempted';
        if (formSubmit) {
          status = 'Form Submitted';
        } else if (linkClick) {
          status = 'Link Clicked';
        }
await this.leadRepository.update(
  { id: lead.lead_id }, // Condition for selecting the lead
  { reminder: new Date(),
    status:'Reminder'
   } // Field to be updated
);  
 await this.zohoSyncService.updateLeadInZoho(zohoLead.id, {
          leadStatus: status,
          lastCalledAt: new Date().toISOString(),
          callType: 'reminder'
        });

      } catch (error) {
        this.logger.error(`Error updating Zoho CRM: ${error.message}`);
        // Continue with the call even if Zoho update fails
      }

      // Make the call via RetellAI API
      const response = await axios.post(
        this.apiUrl,
        {
          from_number: cleanFromNumber,
          to_number: cleanToNumber,
          override_agent_id: overrideAgentId,
          retell_llm_dynamic_variables: {
            lead_name: `${lead.firstName}`,
            follow_up_weeks: "2 weeks",
            consultation_link: "https://machinerymax.com/schedule",
            contact_info: "contact@machinerymax.com | (555) 123-4567",
            lead_phone_number: lead.phone,
          },
          metadata: { 
            lead_id: lead.lead_id ,
            call_type: 'reminder'
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update lead status
      // lead.status = 'CALLING';
      // await this.leadRepository.save(lead);
      return response.data;}
    } catch (error) {
      throw new HttpException(`Failed to make call: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Cleans and formats a phone number to ensure it's in the proper format for the API
   * Removes any non-numeric characters except + at the start
   */
  private cleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + if it doesn't already
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // If it's a US/Canada number without country code, add +1
    if (cleaned.length === 11 && cleaned.startsWith('+')) {
      cleaned = '+1' + cleaned.slice(1);
    } else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    }
    
    return cleaned;;
  }

  private async createOrUpdateCallHistory(call: any, leadId: string, status: string): Promise<any> {
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
        fromNumber: call.from_number,
        toNumber: call.to_number,
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

  private async storeTranscript(call: any, callHistoryId: string): Promise<any> {
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

  private extractLeadId(call: any): string | null {
    // Check metadata for lead_id
    if (call.metadata && call.metadata.lead_id) {
      return call.metadata.lead_id;
    }
    
    // Try to find lead ID in call parameters
    if (call.parameters && call.parameters.lead_id) {
      return call.parameters.lead_id;
    }
    
    return null;
  }

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

      const transcript = call.transcript;

      // Create structured messages for the chat
      const messages = [
        {
          role: "system",
          content: `You are an information extractor. Extract contact information and scheduling details from conversations.`
        },
        {
          role: "user",
          content: `Analyze this conversation and extract:
1. The preferred contact method (must be "email", "phone", "both", "schedule", or "none")
2. The contact information (email address and/or phone number)
3. If scheduling is mentioned, extract the number of days for callback 
4. Convert any specific time mentioned for callback into a 24-hour format (e.g., "6 PM" to "18:00")
5. Resent link 
Return ONLY a JSON object with these fields:
- preferredMethod: "email", "phone", "both", "schedule", or "none"
- contactInfo: {
    email: the email address or null,
    phone: the phone number or null
  }
- scheduleDays: number of days for callback or null
- specificTime: the specific time mentioned for callback in 24-hour format or null
- resentLink: boolean
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

        if (contactInfo.resentLink) {
          if (lead.zohoEmail) {
            await this.mailService.sendVerificationLink(lead);
            this.logger.log(`Sent verification email to ${lead.zohoEmail}`);
          }
          if (lead.zohoPhoneNumber) {
            await this.smsService.sendVerificationSMS(lead);
            this.logger.log(`Sent verification SMS to ${lead.zohoPhoneNumber}`);
          }
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
          await this.leadRepository.save(lead);
        }
        // Handle email only
        else if (contactInfo.preferredMethod === 'email') {
          lead.zohoEmail = contactInfo.contactInfo.email;
          await this.leadRepository.save(lead);
          await this.mailService.sendVerificationLink(lead);
          this.logger.log(`Sent verification email to ${contactInfo.contactInfo.email}`);
        } 
        // Handle phone only
        else if (contactInfo.preferredMethod === 'phone') {
          lead.zohoPhoneNumber = contactInfo.contactInfo.phone;
          await this.leadRepository.save(lead);
          await this.smsService.sendVerificationSMS(lead);
          this.logger.log(`Sent verification SMS to ${contactInfo.contactInfo.phone}`);
        }
        else {
          lead.scheduledCallbackDate = await this.getNextScheduleDay();
          await this.leadRepository.save(lead);   
          this.logger.log(`No contact method specified, scheduled callback for next business day: ${lead.scheduledCallbackDate.toISOString()}`);
        }

      } catch (error) {
        this.logger.error(`Error processing transcript: ${error.message}`, error.stack);
      }
    } catch (error) {
      this.logger.error(`Error in processTranscriptForContactInfo: ${error.message}`, error.stack);
    }
  }

  /**
   * Get call details from Retell AI API
   */
  public async getCallDetail(callId: string): Promise<any> {
    try {
      if (!this.apiKey) throw new Error('RetellAI API key is not configured');
      
      const response = await axios.get(`${this.retellBaseUrl}/v2/get-call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting call detail for callId ${callId}: ${error.message}`);
      throw new HttpException(
        `Failed to get call detail: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 