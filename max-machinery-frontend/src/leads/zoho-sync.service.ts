import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import axios from 'axios';
import { Not, IsNull } from 'typeorm';
import { CallTranscript } from '../retell/entities/call-transcript.entity';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { VerificationService } from './verification.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZohoSyncService {
  private readonly logger = new Logger(ZohoSyncService.name);
  private accessToken: string = null;
  private tokenExpiry: Date = null;
  private openai: ChatOpenAI;

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(CallTranscript)
    private readonly callTranscriptRepository: Repository<CallTranscript>,
    @Inject(forwardRef(() => VerificationService))
    private readonly verificationService: VerificationService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new ChatOpenAI({
      openAIApiKey: this.configService.get('OPENAI_API_KEY'),
      temperature: 0,
      modelName: this.configService.get('OPENAI_MODEL_NAME')
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncLeadsWithZoho() {
    try {
      this.logger.log('Starting Zoho CRM sync');
      
      // Get all leads that need to be checked
      const leads = await this.leadRepository.find({
        where: [
          { email: Not(IsNull()) },
          { email: Not('') }
        ],
        select: ['id', 'email', 'contacted'] // Only select fields we need
      });

      for (const lead of leads) {
        try {
          // Check if we need to refresh the token
          await this.ensureValidAccessToken();
          
          // Search for lead in Zoho
          const zohoLead = await this.searchLeadInZoho(lead.email);
          
          if (!zohoLead) {
            // If lead not found, check call transcripts for contact info
            const contactInfo = await this.extractContactInfoFromTranscripts(lead.id);
            
            if (contactInfo) {
              // Handle contact preference first
              await this.handleContactPreference(lead, contactInfo);
              
              // Try searching Zoho again with the new contact info
              let foundLead = null;
              
              if (contactInfo.email) {
                foundLead = await this.searchLeadInZoho(contactInfo.email);
              }
              
              if (!foundLead && contactInfo.phone) {
                foundLead = await this.searchLeadInZohoByPhone(contactInfo.phone);
              }
              
              if (foundLead) {
                // Update our lead with Zoho data
                await this.updateLeadWithZohoData(lead, foundLead);
              }
            }
          } else {
            // Update our lead with Zoho data
            await this.updateLeadWithZohoData(lead, zohoLead);
          }
        } catch (error) {
          this.logger.error(`Error processing lead ${lead.id}: ${error.message}`);
          continue; // Continue with next lead even if one fails
        }
      }
      
      this.logger.log('Completed Zoho CRM sync');
    } catch (error) {
      this.logger.error(`Error in Zoho sync: ${error.message}`);
    }
  }

  private async ensureValidAccessToken(): Promise<void> {
    // Check if token is still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)) {
      return;
    }

    try {
      const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
        params: {
          grant_type: 'refresh_token',
          client_id: this.configService.get('ZOHO_CLIENT_ID'),
          client_secret: this.configService.get('ZOHO_CLIENT_SECRET'),
          refresh_token: this.configService.get('ZOHO_REFRESH_TOKEN')
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      this.logger.log('Successfully refreshed Zoho access token');
    } catch (error) {
      this.logger.error(`Error refreshing Zoho token: ${error.message}`);
      throw error;
    }
  }

  private async searchLeadInZoho(email: string): Promise<any> {
    try {
      const response = await axios.get('https://www.zohoapis.com/crm/v2/Leads/search', {
        params: { email },
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`
        }
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error searching lead in Zoho: ${error.message}`);
      throw error;
    }
  }

  private async extractContactInfoFromTranscripts(leadId: string): Promise<{ 
    email?: string; 
    phone?: string;
    preference?: 'email' | 'phone' | 'none';
  } | null> {
    try {
      // Get all transcripts for this lead
      const transcripts = await this.callTranscriptRepository.find({
        where: { 
          callHistory: { lead_id: leadId } 
        },
        relations: ['callHistory']
      });

      if (!transcripts.length) {
        return null;
      }

      // Combine all transcripts
      const combinedTranscript = transcripts.map(t => t.transcript).join('\n\n');

      // Create prompt template for contact info and preference extraction
      const promptTemplate = PromptTemplate.fromTemplate(`
        Analyze this conversation and extract:
        1. Any email addresses mentioned
        2. Any phone numbers mentioned
        3. The person's preferred contact method (email/phone/none)

        Only respond in this exact JSON format:
        {
          "email": "email@example.com or null if none found",
          "phone": "phone number in E.164 format or null if none found",
          "preference": "email" or "phone" or "none" based on what they want to receive information through,
          "confidence": "high/medium/low based on context certainty"
        }

        Conversation: {transcript}
      `);

      // Create chain
      const chain = RunnableSequence.from([
        promptTemplate,
        this.openai,
        new StringOutputParser()
      ]);

      // Run analysis
      const result = await chain.invoke({ transcript: combinedTranscript });
      
      try {
        const parsed = JSON.parse(result);
        
        // Only return high/medium confidence results
        if (parsed.confidence !== 'low') {
          return {
            email: parsed.email === 'null' ? undefined : parsed.email,
            phone: parsed.phone === 'null' ? undefined : parsed.phone,
            preference: parsed.preference === 'none' ? undefined : parsed.preference
          };
        }
      } catch (e) {
        this.logger.error('Failed to parse LLM response:', e);
      }
    } catch (error) {
      this.logger.error(`Error extracting contact info from transcripts: ${error.message}`);
    }

    return null;
  }

  private async handleContactPreference(lead: Lead, contactInfo: { 
    email?: string; 
    phone?: string;
    preference?: 'email' | 'phone' | 'none';
  }): Promise<void> {
    try {
      // Update lead with new contact info if found
      if (contactInfo.email) {
        lead.email = contactInfo.email;
      }
      if (contactInfo.phone) {
        lead.phone = contactInfo.phone;
      }
      await this.leadRepository.save(lead);

      // Send verification based on preference
      if (contactInfo.preference === 'email' && lead.email) {
        await this.verificationService.sendVerificationLink(
          lead.firstName,
          lead.lastName,
          lead.email,
          null,
          lead.id
        );
        this.logger.log(`Sent verification link to email for lead ${lead.id}`);
      } else if (contactInfo.preference === 'phone' && lead.phone) {
        await this.verificationService.sendVerificationLink(
          lead.firstName,
          lead.lastName,
          null,
          lead.phone,
          lead.id
        );
        this.logger.log(`Sent verification link to phone for lead ${lead.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling contact preference: ${error.message}`);
    }
  }

  private async updateLeadWithZohoData(lead: Lead, zohoLead: any): Promise<void> {
    try {
      // Update local lead with Zoho data
      lead.firstName = zohoLead.First_Name || lead.firstName;
      lead.lastName = zohoLead.Last_Name || lead.lastName;
      lead.email = zohoLead.Email || lead.email;
      lead.phone = zohoLead.Phone || lead.phone;
      lead.company = zohoLead.Company || lead.company;
      lead.jobTitle = zohoLead.Title || lead.jobTitle;
      lead.industry = zohoLead.Industry || lead.industry;
      
      // Store Zoho ID and other metadata
      if (!lead.additionalInfo) {
        lead.additionalInfo = {};
      }
      lead.additionalInfo.zohoId = zohoLead.id;
      lead.additionalInfo.zohoCreatedTime = zohoLead.Created_Time;
      lead.additionalInfo.zohoModifiedTime = zohoLead.Modified_Time;
      
      // Save the updated lead
      await this.leadRepository.save(lead);
    } catch (error) {
      this.logger.error(`Failed to update lead with Zoho data: ${error.message}`);
      throw error;
    }
  }

  private async searchLeadInZohoByPhone(phone: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://www.zohoapis.com/crm/v2/Leads/search`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${await this.getAccessToken()}`,
            'Content-Type': 'application/json'
          },
          params: {
            criteria: `(Phone:equals:${phone})`
          }
        }
      );

      if (response.data?.data?.length > 0) {
        return response.data.data[0];
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to search lead in Zoho by phone: ${error.message}`);
      return null;
    }
  }

  private async createLeadInZoho(lead: Partial<Lead>): Promise<any> {
    try {
      const response = await axios.post(
        'https://www.zohoapis.com/crm/v2/Leads',
        {
          data: [{
            First_Name: lead.firstName,
            Last_Name: lead.lastName,
            Email: lead.email,
            Phone: lead.phone,
            Company: lead.company,
            Title: lead.jobTitle,
            Industry: lead.industry,
            Lead_Source: 'MaxMachinery',
            Description: `Machinery Interest: ${lead.machineryInterest || 'N/A'}\nMachinery Notes: ${lead.machineryNotes || 'N/A'}`,
            $custom_fields: {
              Has_Surplus_Machinery: lead.hasSurplusMachinery,
              Machinery_Types: lead.machineryDetails?.types?.join(', '),
              Machinery_Brands: lead.machineryDetails?.brands?.join(', '),
              Machinery_Condition: lead.machineryDetails?.condition,
              Machinery_Age: lead.machineryDetails?.age,
              Estimated_Value: lead.machineryDetails?.estimatedValue
            }
          }]
        },
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${await this.getAccessToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.data?.length > 0) {
        return response.data.data[0];
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to create lead in Zoho: ${error.message}`);
      return null;
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        null,
        {
          params: {
            refresh_token: process.env.ZOHO_REFRESH_TOKEN,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            grant_type: 'refresh_token'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      return this.accessToken;
    } catch (error) {
      this.logger.error(`Failed to get Zoho access token: ${error.message}`);
      throw error;
    }
  }
} 