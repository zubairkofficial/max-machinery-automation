import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallHistory } from '../leads/entities/call-history.entity';
import { VerificationService } from '../leads/verification.service';
import { Lead } from '../leads/entities/lead.entity';
import { CallTranscript } from './entities/call-transcript.entity';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class RetellService {
  private readonly logger = new Logger(RetellService.name);
  private openai: ChatOpenAI;

  constructor(
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(CallTranscript)
    private callTranscriptRepository: Repository<CallTranscript>,
    @Inject(forwardRef(() => VerificationService))
    private verificationService: VerificationService,
  ) {
    this.openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
      modelName: 'gpt-3.5-turbo'
    });
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
        fromNumber: '+14158436193', // Default value, update if available in call data
        toNumber: '', // To be filled from lead data if available
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

      const transcript = call.transcript;

      // Create prompt template
      const promptTemplate = PromptTemplate.fromTemplate(`
        Analyze this conversation and tell me if the person wants to receive something via email or phone/SMS.
        Only respond with one of these exact words: "email", "phone", or "none".
        Do not include any other text in your response.

        Conversation: {transcript}
      `);

      // Create chain using the newer RunnableSequence
      const chain = RunnableSequence.from([
        promptTemplate,
        this.openai,
        new StringOutputParser()
      ]);

      try {
        const result = await chain.invoke({ transcript });
        const preference = result.trim().toLowerCase();

        // Validate preference
        if (!['email', 'phone', 'none'].includes(preference)) {
          throw new Error(`Invalid preference result: ${preference}`);
        }

        // Send verification link based on user preference
        if (preference === 'email' && lead.email) {
          await this.sendVerificationLink(
            lead.firstName,
            lead.lastName,
            lead.email,
            null,
            leadId
          );
          this.logger.log(`Verification link sent to email for lead ${leadId}`);
        } else if (preference === 'phone' && lead.phone) {
          await this.sendVerificationLink(
            lead.firstName,
            lead.lastName,
            null,
            lead.phone,
            leadId
          );
          this.logger.log(`Verification link sent to phone for lead ${leadId}`);
        } else {
          // If no clear preference or missing contact info, try email as fallback
          if (lead.email) {
            await this.sendVerificationLink(
              lead.firstName,
              lead.lastName,
              lead.email,
              null,
              leadId
            );
            this.logger.log(`Fallback verification link sent to email for lead ${leadId}`);
          } else {
            this.logger.warn(`No valid contact method available for lead ${leadId}`);
          }
        }
      } catch (error) {
        if (error.message.includes('Invalid preference')) {
          this.logger.warn(`${error.message} - Using email as fallback`);
          if (lead.email) {
            await this.sendVerificationLink(
              lead.firstName,
              lead.lastName,
              lead.email,
              null,
              leadId
            );
          }
        } else {
          this.logger.error(`Error analyzing transcript with LangChain: ${error.message}`, error.stack);
          // Try email as fallback on error
          if (lead.email) {
            await this.sendVerificationLink(
              lead.firstName,
              lead.lastName,
              lead.email,
              null,
              leadId
            );
            this.logger.log(`Error recovery: Sent verification to email for lead ${leadId}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in processTranscriptForContactInfo: ${error.message}`, error.stack);
      // Don't throw here - we want to handle errors gracefully at this level
    }
  }

  /**
   * Send verification link to email and/or phone
   */
  private async sendVerificationLink(
    firstName: string,
    lastName: string,
    email: string | null,
    phone: string | null,
    leadId: string
  ): Promise<void> {
    try {
      // Create verification token and send links
      const verification = await this.verificationService.createVerificationToken({
        email,
        phone,
        firstName,
        lastName,
        leadId
      });

      // Send email if available
      if (email) {
        await this.verificationService.sendVerificationByEmail(verification);
      }
      
      // Send SMS if available
      if (phone) {
        await this.verificationService.sendVerificationBySms(verification);
      }

      this.logger.log(`Verification links sent to lead ${leadId}`);
    } catch (error) {
      this.logger.error(`Error sending verification links: ${error.message}`, error.stack);
      throw error; // Re-throw to handle at higher level
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
}
