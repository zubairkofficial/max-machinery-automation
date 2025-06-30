import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import axios from 'axios';
import { Not, IsNull } from 'typeorm';
import { CallTranscript } from '../retell/entities/call-transcript.entity';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ConfigService } from '@nestjs/config';
import { UserInfo } from 'src/userInfo/entities/user-info.entity';
import { MailService } from 'src/mail/mail.service';
import { SmsService } from 'src/sms/sms.service';
import { RetellService } from 'src/retell/retell.service';
import { RetellAiService } from './retell-ai.service';

@Injectable()
export class ZohoSyncService {
  private readonly logger = new Logger(ZohoSyncService.name);
  private accessToken: string = null;
  private tokenExpiry: Date = null;
  private openai: ChatOpenAI;

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(UserInfo)
    private readonly userInfoRepository: Repository<UserInfo>,
    @InjectRepository(CallTranscript)
    private readonly callTranscriptRepository: Repository<CallTranscript>,
    private readonly configService: ConfigService,
    private readonly retellAiService:RetellAiService,
  ) {
    this.openai = new ChatOpenAI({
      openAIApiKey: this.configService.get('OPENAI_API_KEY'),
      temperature: 0,
      modelName: this.configService.get('OPENAI_MODEL_NAME')
    });
    
  }

  // @Cron(CronExpression.EVERY_30_MINUTES)
  // async syncLeadsWithZoho() {
  //   try {
  //     this.logger.log('Starting Zoho CRM sync');
      
  //     // Get all leads that need to be checked
  //     const userInfo = await this.userInfoRepository.find({
  //       where: [
  //         { email: Not(IsNull()) },
  //         { email: Not('') },
  //         { contacted: false }
  //       ],
  //       select: ['id', 'email', 'contacted','leadId'], // Only select fields we need      
  //     });

  //     for (const leadInfo of userInfo) {
  //       try {
  //         // Check if we need to refresh the token
  //         await this.ensureValidAccessToken();
          
  //         // Search for leadInfo in Zoho
  //         const zohoLead = await this.searchLeadInZoho(leadInfo.email);
          
  //         if (!zohoLead?.Email ) {
  //           // If leadInfo not found, check call transcripts for contact info
  //           const leadRes = await this.leadRepository.findOne({where:{id:leadInfo.leadId}});
            
  //           if (leadRes) {
            
  //             // Try searching Zoho again with the new contact info
  //             let foundLead = null;
              
  //             if (leadRes.zohoEmail) {
  //               foundLead = await this.searchLeadInZoho(leadRes.zohoEmail);
  //             }
              
  //             if (!foundLead && leadRes.zohoPhoneNumber) {
  //               foundLead = await this.searchLeadInZohoByPhone(leadRes.zohoPhoneNumber);
  //             }
              
  //             if (foundLead) {
  //               // Update our lead with Zoho data
  //               await this.updateLeadWithZohoData(leadInfo);
  //             }else {
  //               if(leadRes.zohoEmail){
  //                 await this.mailService.sendVerificationLink(leadRes);
  //               }
  //               else if (leadRes.zohoPhoneNumber){
                  
  //                  await this.smsService.sendVerificationSMS(leadRes);
  //               }

  //             }
             
  //           }
  //         } else {
  //           // Update our lead with Zoho data
  //           await this.updateLeadWithZohoData(leadInfo);
  //         }
  //       } catch (error) {
  //         this.logger.error(`Error processing lead ${leadInfo.id}: ${error.message}`);
  //         continue; // Continue with next lead even if one fails
  //       }
  //     }
      
  //     this.logger.log('Completed Zoho CRM sync');
  //   } catch (error) {
  //     this.logger.error(`Error in Zoho sync: ${error.message}`);
  //   }
  // }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async zohoLinkNoCall() {
    try {
      this.logger.log('Starting Zoho CRM sync');

      const leads = await this.leadRepository
  .createQueryBuilder('lead')
  .leftJoinAndSelect('lead.userInfo', 'userInfo') // Left join with userInfo
  .where(
    new Brackets(qb => {
      qb.where('lead.contacted = :contacted', { contacted: true })
        .andWhere('lead.zohoEmail IS NOT NULL AND lead.zohoPhoneNumber IS NULL') // First condition
        .orWhere('lead.contacted = :contacted AND lead.zohoEmail IS NULL AND lead.zohoPhoneNumber IS NOT NULL') // Second condition
        .orWhere('lead.contacted = :contacted AND lead.zohoEmail IS NOT NULL AND lead.zohoPhoneNumber IS NOT NULL'); // Third condition
    })
  )
  .andWhere('userInfo.id IS NULL') // Ensure userInfo does not exist
  .select(['lead.id', 'lead.zohoEmail', 'lead.zohoPhoneNumber']) // Only select needed fields
  .getMany(); // Use getMany() to return the results as an array

// Now, `leads` will contain only leads that satisfy the given conditions and do not have an associated UserInfo


for(const lead of leads) {

  try {
     const formSumbit=false
    const linkClick=false
    await this.retellAiService.makeCallLeadZoho(lead,this.configService.get<string>('FROM_PHONE_NUMBER'), formSumbit,linkClick,this.configService.get<string>('AGENT_ID'));
  } catch (error) {
    this.logger.error(`Error processing lead ${lead.id}: ${error.message}`);
    continue; // Continue with next lead even if one fails
  }
}

      // Get all leads that need to be checked
      const userInfo = await this.userInfoRepository.find({
        where: [
          { email: Not(IsNull()) },
          { email: Not('') },
          { contacted: false }
        ],
        select: ['id', 'email', 'contacted','leadId'], // Only select fields we need      
      });

      for (const userLeadInfo of userInfo) {
        try {
          // Check if we need to refresh the token
          await this.ensureValidAccessToken();
          
            // If userLeadInfo not found, check call transcripts for contact info
            const leadRes = await this.leadRepository.findOne({where:{id:userLeadInfo.leadId}});
            
            if (leadRes) {
            
              // Try searching Zoho again with the new contact info
              let foundLead = null;
              
              if (leadRes.zohoEmail) {
                foundLead = await this.searchLeadInZoho(leadRes.zohoEmail);
              }
              
              if (!foundLead && leadRes.zohoPhoneNumber) {
                foundLead = await this.searchLeadInZohoByPhone(leadRes.zohoPhoneNumber);
              }
                // await this.retellAiService.makeCallLeadZoho(leadRes,this.configService.get<string>('FROM_PHONE_NUMBER'), false,true,this.configService.get<string>('AGENT_ID'));
              
              if (!foundLead?.Email ) {
                const formSumbit=false
                const linkClick=true
                // Update our lead with Zoho data
                await this.retellAiService.makeCallLeadZoho(leadRes,this.configService.get<string>('FROM_PHONE_NUMBER'), formSumbit,linkClick,this.configService.get<string>('AGENT_ID'));
              }else {
            // Update our lead with Zoho data
            await this.updateLeadWithZohoData(userLeadInfo);
          }
          }   
        } catch (error) {
          this.logger.error(`Error processing lead ${userLeadInfo.id}: ${error.message}`);
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


 async getZohoLead(lead: Lead): Promise<any> {
  try {
    await this.ensureValidAccessToken();
    const response = await axios.get(`https://www.zohoapis.com/crm/v2/Leads/search?criteria=(Email:equals:${lead.zohoEmail})`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
      },
    });

    console.log('Lead details:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      this.logger.error(`Error fetching lead from Zoho CRM: ${JSON.stringify(error.response.data)}`);
    } else {
      this.logger.error(`Error fetching lead from Zoho CRM: ${error.message}`);
    }
    return null;  // Return null or handle error as per your logic
  }
}



  async createZohoLead(leadData: Lead,status: string) {
  try {
    await this.ensureValidAccessToken();
    const response = await axios.post('https://www.zohoapis.com/crm/v2/Leads', {
      data: [
        {
          "First_Name": leadData.firstName,
          "Last_Name": leadData.lastName,
          "Email": leadData.zohoEmail,
          "Phone": leadData?.zohoPhoneNumber??leadData.phone,
          "Lead_Id": leadData.id,
          "Lead_Status": status, // Default lead status for new leads
        }
      ]
    }, {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
      }
    });

    console.log('Lead created in Zoho CRM:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating lead in Zoho CRM:', error.message);
  }
}


 async updateZohoLead(lead, leadData) {
  try {
    await this.ensureValidAccessToken();

      const searchResponse = await axios.get(`https://www.zohoapis.com/crm/v2/Leads/search?criteria=(Email:equals:${lead.zohoEmail})`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
      }
    });

     if (searchResponse.data.data && searchResponse.data.data.length > 0) {
    const leadId = searchResponse.data.data[0].id; // Get the first matching lead

      // Step 2: Update the lead with new data (PUT request)
      const updateResponse = await axios.put(`https://www.zohoapis.com/crm/v2/Leads/${leadId}`, {
        data: [
          {
           
            "Lead_Status": leadData || 'Form Submitted', // Default to 'Form Submitted' if no status provided
          }
        ]
      }, {
        headers: {
          Authorization: `Zoho-oauthtoken ${this.accessToken}`,
        }
      });
      console.log('Lead updated in Zoho CRM:', updateResponse.data);
      return updateResponse.data;
    }
} catch (error) {
    console.error('Error updating lead in Zoho CRM:', error.message);
  }}
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

  private async handleContactPreference(userInfo:UserInfo, contactInfo: { 
    email?: string; 
    phone?: string;
    preference?: 'email' | 'phone' | 'none';
  }): Promise<void> {
    try {
      // Update lead with new contact info if found
      if (contactInfo.email) {
        userInfo.email = contactInfo.email;
      }
      if (contactInfo.phone) {
        userInfo.phone = contactInfo.phone;
      }
      await this.leadRepository.save(userInfo);

     
    } catch (error) {
      this.logger.error(`Error handling contact preference: ${error.message}`);
    }
  }

  private async updateLeadWithZohoData(userInfo: UserInfo): Promise<void> {
    try {
      // Update local lead with Zoho data
      // userInfo.firstName = zohoLead.First_Name || userInfo.firstName;
      // userInfo.lastName = zohoLead.Last_Name || userInfo.lastName;
      // userInfo.email = zohoLead.Email || userInfo.email;
      // userInfo.phone = zohoLead.Phone || userInfo.phone;
      userInfo.contacted = true;
      // Store Zoho ID and other metadata
    
      
      // Save the updated userInfo
      await this.userInfoRepository.save(userInfo);
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