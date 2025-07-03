import { Injectable, Logger, HttpException, HttpStatus, forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';
import { LastCall } from './entities/last-call.entity';

@Injectable()
export class RetellAiService {
  private readonly logger = new Logger(RetellAiService.name);
  private readonly apiUrl = 'https://api.retellai.com/v2/create-phone-call';
  private readonly retellBaseUrl = 'https://api.retellai.com';

  private readonly apiKey: string;
  private readonly llmId: string;
  constructor(private configService: ConfigService,
  @Inject(forwardRef(() => LeadsService)) // ✅ Use forwardRef
    private leadsService: LeadsService,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
     @InjectRepository(LastCall) // ✅ Decorator for LastCall
    private readonly lastCallRepository: Repository<LastCall>,
    // private readonly retellService: RetellService,
  ) {
    this.apiKey = this.configService.get<string>('RETELL_AI_API_KEY');
    this.llmId = this.configService.get<string>('LLM_ID')|| "llm_bec730a8baacffdb13ec0cc522a4";
    
    if (!this.apiKey) {
      this.logger.warn('RETELL_AI_API_KEY is not set in environment variables');
    }
  }

  /**
   * Makes a phone call using RetellAI API
   */
private async updateRetellLLM(llmId: string, promptType: 'master' | 'reminder' | 'busy',lastCallTranscription?:string): Promise<void> {
    const retell = await this.leadsService.getByRetellId(llmId);
    let prompt = '';

    switch (promptType) {
      case 'master':
        prompt = retell.masterPrompt;
        break;
      case 'reminder':
        prompt = retell.reminderPrompt;
        break;
      case 'busy':
        prompt = `${retell.busyPrompt}\n\nPrevious Call Transcription:\n${lastCallTranscription}`;
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

  // Call making method with error handling
  public async makeCall(fromNumber: string, toNumber: string, id: string, type: string, overrideAgentId?: string): Promise<any> {
    try {
      if (!this.apiKey) throw new Error('RetellAI API key is not configured');
      if (!toNumber) throw new Error('No phone number provided for the call');

     const lead = await this.leadRepository.findOne({ 
  where: { id },
  relations: ['lastCallRecord'] // ✅ Add this to load the relationship
});

      const cleanFromNumber = this.cleanPhoneNumber(fromNumber);
      const cleanToNumber = this.cleanPhoneNumber(toNumber);

   let lastCallTranscription = '';
if (lead.lastCallRecord) {
  try {
    const call = await axios.get(
      `${this.retellBaseUrl}/v2/get-call/${lead.lastCallRecord.callId}`, // ✅ Use callId directly
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
      // Choose the prompt type based on the call type
      const promptType: 'master' | 'reminder' | 'busy' = type === 'rescheduled' ? 'busy' : 'master';
      await this.updateRetellLLM(this.llmId, promptType,lastCallTranscription);

      // Make the call via RetellAI API
      const response = await axios.post(
        this.apiUrl,
        {
          from_number: cleanFromNumber,
          to_number: cleanToNumber,
          override_agent_id: overrideAgentId,
          retell_llm_dynamic_variables: {
            lead_name: `${lead.firstName}${lead.lastName}`,
            follow_up_weeks: "2 weeks",
            consultation_link: "https://machinerymax.com/schedule",
            contact_info: "contact@machinerymax.com | (555) 123-4567",
          },
          metadata: { lead_id: lead.id },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update lead status
      lead.status = 'CALLING';
      await this.leadRepository.save(lead);
      return response.data;
    } catch (error) {
      throw new HttpException(`Failed to make call: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Lead call reminder handling method
  public async makeCallLeadZoho(userLead: any, fromNumber: string, formNotSubmit: boolean, linkClick: boolean, overrideAgentId: string): Promise<any> {
    try {
      if (!this.apiKey) throw new Error('RetellAI API key is not configured');
      if (!userLead.phone) throw new Error('No phone number provided for the call');

      await this.updateRetellLLM(this.llmId, 'reminder');  // Use 'reminder' prompt for this case

      const cleanFromNumber = this.cleanPhoneNumber(fromNumber);
      const cleanToNumber = this.cleanPhoneNumber(userLead.phone);

      const response = await axios.post(
        this.apiUrl,
        {
          from_number: cleanFromNumber,
          to_number: cleanToNumber,
          override_agent_id: overrideAgentId,
          retell_llm_dynamic_variables: {
            lead_name: `${userLead.firstName}${userLead.lastName}`,
            form_not_submit: formNotSubmit ? 'true' : 'false',
            link_click: linkClick ? 'true' : 'false',
          },
          metadata: { lead_id: userLead.id },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update lead status
      userLead.status = 'CALLING';
      await this.leadRepository.save(userLead);
      return response.data;
    } catch (error) {
      throw new HttpException(`Failed to make lead Zoho call: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Cleans and formats a phone number to ensure it's in the proper format for the API
   * Removes any non-numeric characters except + at the start
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except + at the start
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
    
    return cleaned;
  }
} 