import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
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

@Injectable()
export class RetellService {
  private readonly logger = new Logger(RetellService.name);
  private openai: ChatOpenAI;
  private readonly retellApiKey: string;
  private readonly retellApiUrl: string;

  constructor(
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(CallTranscript)
    private callTranscriptRepository: Repository<CallTranscript>,
    private mailService: MailService,
    private smsService: SmsService,
    private jwtService: JwtService
  ) {
    this.openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
      modelName: 'gpt-4'
    });
    this.retellApiKey = process.env.RETELL_API_KEY;
    this.retellApiUrl = 'https://api.retellai.com';
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

  /**
   * Process transcript for email or phone information
   */
  private async processTranscriptForContactInfo(call: any, leadId: string): Promise<void> {
    try {
      if (!call.transcript) {
        this.logger.warn(`No transcript found for call ${call.call_id}`);
        return;
      }

      // Get lead info first to fail fast if not found
      const lead = await this.leadRepository.findOne({
        where: { id: leadId }
      });

      if (!lead) {
        this.logger.warn(`Lead not found for ID: ${leadId}`);
        return;
      }

      const transcript = transcription
      // call.transcript;

      // Create structured messages for the chat
      const messages = [
        {
          role: "system",
          content: `You are an information extractor. Extract contact information and scheduling details from conversations.`
        },
        {
          role: "user",
          content: `Analyze this conversation and extract:
1. The preferred contact method (must be "email", "phone", "schedule", or "none")
2. The contact information (email address or phone number)
3. If scheduling is mentioned, extract the number of days for callback 
4. Convert any specific time mentioned for callback into a 24-hour format (e.g., "6 PM" to "18:00")

Return ONLY a JSON object with these fields:
- preferredMethod: "email", "phone", "schedule", or "none"
- contactInfo: the actual email/phone or null
- scheduleDays: number of days for callback or null
- specificTime: the specific time mentioned for callback in 24-hour format or null

Conversation:
${transcript}`
        }]

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


       if (contactInfo.preferredMethod === 'schedule' && contactInfo.scheduleDays) {
  const scheduleDate = new Date();
  scheduleDate.setDate(scheduleDate.getDate() + contactInfo.scheduleDays);
  
  // Set the specific time (18:00)
  if(contactInfo.specificTime) {
  const [hours, minutes] = contactInfo?.specificTime?.split(':').map(Number);
  
  // Set the hours and minutes
  scheduleDate.setHours(hours);
  scheduleDate.setMinutes(minutes);
  scheduleDate.setSeconds(0); // Optional: set seconds to 0
  }
  // Store the scheduled callback date
  lead.scheduledCallbackDate = scheduleDate;
  await this.leadRepository.save(lead);
  
  this.logger.log(`Scheduled callback for ${scheduleDate.toISOString()}`);
  return;
}  // Update lead with extracted information
        if (contactInfo.preferredMethod === 'email') {
          // Store original email in zohoEmail
          lead.zohoEmail = contactInfo.contactInfo;
          
          await this.leadRepository.save(lead);
          await this.mailService.sendVerificationLink(lead);
          this.logger.log(`Sent verification email to ${contactInfo.contactInfo}`);
        } 
        else if (contactInfo.preferredMethod === 'phone') {
          // Store original phone in zohoPhoneNumber
          lead.zohoPhoneNumber = contactInfo.contactInfo;
          await this.leadRepository.save(lead);
          await this.smsService.sendVerificationSMS(lead);
          this.logger.log(`Sent verification SMS to ${contactInfo.contactInfo}`);
        }
        else{
        lead.scheduledCallbackDate= this.getNextBusinessDay()
        await this.leadRepository.save(lead);   
      }

      } catch (error) {
        this.logger.error(`Error processing transcript: ${error.message}`, error.stack);
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

  /**
   * Update Retell AI agent prompt
   */
  async updateAgentPrompt(agentId: string, prompt: string): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.retellApiUrl}/update-agent/${agentId}`,
        {
          prompt: prompt
        },
        {
          headers: {
            'Authorization': `Bearer ${this.retellApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.log(`Successfully updated prompt for agent ${agentId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error updating agent prompt: ${error.message}`, error.stack);
      throw error;
    }
  }
}
