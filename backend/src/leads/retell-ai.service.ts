import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LeadsService } from './leads.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

@Injectable()
export class RetellAiService {
  private readonly logger = new Logger(RetellAiService.name);
  private readonly apiUrl = 'https://api.retellai.com/v2/create-phone-call';
  private readonly apiKey: string;
// private leadsService: LeadsService;
  constructor(private configService: ConfigService,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {
    this.apiKey = this.configService.get<string>('RETELL_AI_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('RETELL_AI_API_KEY is not set in environment variables');
    }
  }

  /**
   * Makes a phone call using RetellAI API
   */
  async makeCall(fromNumber: string, toNumber: string,id:string, overrideAgentId?: string): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('RetellAI API key is not configured');
      }

      if (!toNumber) {
        throw new Error('No phone number provided for the call');
      }

    const lead = await this.leadRepository.findOne({where:{id}});

      // Clean up phone numbers to ensure proper format
      const cleanFromNumber = this.cleanPhoneNumber(fromNumber);
      const cleanToNumber = this.cleanPhoneNumber(toNumber);

      const response = await axios.post(
        this.apiUrl,
        {
          from_number: cleanFromNumber,
          to_number: cleanToNumber,
          override_agent_id: overrideAgentId,
         retell_llm_dynamic_variables: {
     lead_name:`${lead.firstName}${lead.lastName}`,          // [Lead Name]
      follow_up_weeks: "2 weeks",             // [X weeks] — as string or number
      consultation_link: "https://machinerymax.com/schedule",  // [URL]
      contact_info: "contact@machinerymax.com | (555) 123-4567", // [contact info]
    },
    metadata:{lead_id: lead.id}

        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
     lead.status = 'CALLING';
      await this.leadRepository.save(lead);
      this.logger.log(`Successfully initiated call from ${cleanFromNumber} to ${cleanToNumber}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to make RetellAI call: ${error.message}`, 
        error.stack
      );
      
      throw new HttpException(
        `Failed to make call: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  async makeCallLeadZoho(userLead:Lead, fromNumber: string,formNotSubmit: boolean,linkClick:boolean, overrideAgentId: string,): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('RetellAI API key is not configured');
      }

      if (!userLead.phone) {
        throw new Error('No phone number provided for the call');
      }

   
      // Clean up phone numbers to ensure proper format
      const cleanFromNumber = this.cleanPhoneNumber(fromNumber);
      const cleanToNumber = this.cleanPhoneNumber(userLead.phone);

      const response = await axios.post(
        this.apiUrl,
        {
          from_number: cleanFromNumber,
          to_number: cleanToNumber,
          override_agent_id: overrideAgentId,
         retell_llm_dynamic_variables: {
      lead_name:`${userLead.firstName}${userLead.lastName}`,          // [Lead Name]
     form_not_submit: !!formNotSubmit ? 'true' : 'false',
  link_click: linkClick ? 'true' : 'false',     
     
    },
    metadata:{lead_id: userLead.id}

        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
     userLead.status = 'CALLING';
      await this.leadRepository.save(userLead);
      this.logger.log(`Successfully initiated call from ${cleanFromNumber} to ${cleanToNumber}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to make RetellAI call: ${error.message}`, 
        error.stack
      );
      
      throw new HttpException(
        `Failed to make call: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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