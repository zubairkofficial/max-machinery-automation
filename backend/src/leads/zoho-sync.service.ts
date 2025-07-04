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
import { RetellAiService } from './retell-ai.service';
import { CronSettingsService } from 'src/cron-settings/cron-settings.service';
import { JobName } from 'src/cron-settings/enums/job-name.enum';

export interface ZohoLeadData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  company?: string;
  industry?: string;
  leadStatus?: string;
  description?: string;
  lastCalledAt?: string;
  callType?: string;
}

@Injectable()
export class ZohoSyncService {
  private readonly logger = new Logger(ZohoSyncService.name);
  private accessToken: string;
  private readonly zohoApiUrl = 'https://www.zohoapis.com/crm/v2';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
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
    @Inject(forwardRef(() => RetellAiService))
    private readonly retellAiService: RetellAiService,
    private readonly cronSettingService: CronSettingsService,
  ) {
    this.clientId = this.configService.get<string>('ZOHO_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('ZOHO_CLIENT_SECRET');
    this.refreshToken = this.configService.get<string>('ZOHO_REFRESH_TOKEN');
    this.openai = new ChatOpenAI({
      openAIApiKey: this.configService.get('OPENAI_API_KEY'),
      temperature: 0,
      modelName: this.configService.get('OPENAI_MODEL_NAME')
    });
  }

  
  @Cron(CronExpression.EVERY_MINUTE)
  async zohoLinkNoCall() {
    try {
      this.logger.log('Starting Zoho CRM sync');
   const callReminder = await this.cronSettingService.getByName(JobName.REMINDER_CALL);
    
    if (!callReminder?.isEnabled || !callReminder?.startTime) {
      console.log('ReminderCall job is not enabled or has no start time');
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Get current time in HH:MM format
    const startTime = callReminder.startTime;
    const endTime = callReminder.endTime;

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

    console.log(`Current time: ${currentTime}, Schedule: ${startTime}${endTime ? ` - ${endTime}` : ''}, Should run: ${shouldRun}`);
    
    if (shouldRun) {
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
  .select(['lead.id','lead.phone', 'lead.zohoEmail', 'lead.zohoPhoneNumber']) // Only select needed fields
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
          {
            email: Not(IsNull()),
            contacted: false
          },
          {
            phone: Not(IsNull()),
            contacted: false
          }
        ],
        select: ['id', 'email', 'phone', 'contacted', 'leadId'],
      });

      for (const userLeadInfo of userInfo) {
        try {
          // Check if we need to refresh the token
          await this.ensureValidAccessToken();
          
          // Get the lead information
          const leadRes = await this.leadRepository.findOne({where:{id:userLeadInfo.leadId}});
          
          if (leadRes) {
            // Try searching Zoho with available contact info
            let foundLead = null;
            
            // First try with email if available
            if (userLeadInfo.email) {
              foundLead = await this.searchLeadInZoho(userLeadInfo.email);
            }
            
            // If not found with email, try with phone
            if (!foundLead && userLeadInfo.phone) {
              foundLead = await this.searchLeadInZohoByPhone(userLeadInfo.phone);
            }
            
            // If still not found, try with lead's contact info
            if (!foundLead && leadRes.zohoEmail) {
              foundLead = await this.searchLeadInZoho(leadRes.zohoEmail);
            }
            
            if (!foundLead && leadRes.zohoPhoneNumber) {
              foundLead = await this.searchLeadInZohoByPhone(leadRes.zohoPhoneNumber);
            }
            
            if (!foundLead?.Email) {
              const formSubmit = false;
              const linkClick = true;
              // Make reminder call if lead not found in Zoho
              await this.retellAiService.makeCallLeadZoho(
                leadRes,
                this.configService.get<string>('FROM_PHONE_NUMBER'), 
                formSubmit,
                linkClick,
                this.configService.get<string>('AGENT_ID')
              );
            } else {
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
} else {
  console.log('The times do not match');
}
    } catch (error) {
      this.logger.error(`Error in Zoho sync: ${error.message}`);
    }
    
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUserInfoInZoho() {
    try {
      this.logger.log('Starting UserInfo Zoho check');
      
      // Get all userInfo records that haven't been contacted yet
      const userInfoList = await this.userInfoRepository.find({
        where: [
          {
            email: Not(IsNull()),
            contacted: false
          },
          {
            phone: Not(IsNull()),
            contacted: false
          }
        ],
        select: ['id', 'email', 'phone', 'contacted', 'leadId'],
      });

      this.logger.log(`Found ${userInfoList.length} userInfo records to check`);

      for (const userInfo of userInfoList) {
        try {
          // Check if we need to refresh the token
          await this.ensureValidAccessToken();
          
          let foundInZoho = false;
          
          // Try searching Zoho with email if available
          if (userInfo.email) {
            const foundLead = await this.searchLeadInZoho(userInfo.email);
            if (foundLead?.Email) {
              foundInZoho = true;
              this.logger.log(`Found user in Zoho by email: ${userInfo.email}`);
            }
          }
          
          // If not found with email, try with phone
          if (!foundInZoho && userInfo.phone) {
            const foundLead = await this.searchLeadInZohoByPhone(userInfo.phone);
            if (foundLead?.Phone) {
              foundInZoho = true;
              this.logger.log(`Found user in Zoho by phone: ${userInfo.phone}`);
            }
          }
          
          // If found in Zoho, update the status
          if (foundInZoho) {
            userInfo.contacted = true;
            await this.leadRepository.update(userInfo.leadId, {
              status: 'completed',
              formSubmitted:true,
              contacted: true
            });
            await this.userInfoRepository.save(userInfo);
            this.logger.log(`Updated userInfo status to contacted for ID: ${userInfo.id}`);
          }
          
        } catch (error) {
          this.logger.error(`Error checking userInfo ${userInfo.id} in Zoho: ${error.message}`);
          continue; // Continue with next user even if one fails
        }
      }
      
      this.logger.log('Completed UserInfo Zoho check');
    } catch (error) {
      this.logger.error(`Error in UserInfo Zoho check: ${error.message}`);
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
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken
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
          "Last_Name": leadData.lastName??leadData.firstName,
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
leadData.status=status
await this.leadRepository.save(leadData)
    console.log('Lead created in Zoho CRM:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating lead in Zoho CRM:', error.message);
  }
}

  /**
   * Check if lead exists in Zoho by phone number, create if not exists
   */
  async getOrCreateZohoLeadByPhone(phoneNumber: string, leadData: Lead, status: string = 'Called'): Promise<any> {
    try {
      await this.ensureValidAccessToken();
      
      // First, search for existing lead by phone number
      const existingLead = await this.searchLeadInZohoByPhone(phoneNumber);
      
      if (existingLead) {
        this.logger.log(`Found existing lead in Zoho CRM for phone: ${phoneNumber}`);
        return existingLead;
      }
      
      // Lead doesn't exist, create new one
      this.logger.log(`Creating new lead in Zoho CRM for phone: ${phoneNumber}`);
      const newLead = await this.createZohoLead(leadData, status);
      return newLead;
      
    } catch (error) {
      this.logger.error(`Error in getOrCreateZohoLeadByPhone: ${error.message}`);
      throw error;
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

  public async searchLeadInZohoByPhone(phone: string): Promise<any> {
    try {
      await this.ensureValidAccessToken();
      
      const searchCriteria = `(Phone:equals:${phone})`;
      const response = await axios.get(
        `${this.zohoApiUrl}/Leads/search?criteria=${encodeURIComponent(searchCriteria)}`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          },
        }
      );

      if (response.data?.data?.length > 0) {
        return response.data.data[0];
      }
      return null;
    } catch (error) {
      this.logger.error(`Error searching lead in Zoho by phone: ${error.message}`);
      throw error;
    }
  }

  public async createLeadInZoho(leadData: ZohoLeadData): Promise<any> {
    try {
      await this.ensureValidAccessToken();

      const zohoData = {
        First_Name: leadData.firstName,
        Last_Name:leadData.lastName||leadData.firstName
        Phone: leadData.phone,
        Email: leadData.email || leadData.phone, // Use phone as fallback for email
        Company: leadData.company,
        Industry: leadData.industry,
        Lead_Status: leadData.leadStatus,
        Description: leadData.description
      };

      const response = await axios.post(
        `${this.zohoApiUrl}/Leads`,
        { data: [zohoData] },
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.data?.[0]?.details?.id) {
        return response.data.data[0].details;
      }
      throw new Error('Failed to create lead in Zoho CRM');
    } catch (error) {
      this.logger.error(`Error creating lead in Zoho: ${error.message}`);
      throw error;
    }
  }

  public async updateLeadInZoho(leadId: string, leadData: Partial<ZohoLeadData>): Promise<any> {
    try {
      await this.ensureValidAccessToken();

      const zohoData = {
        Lead_Status: leadData.leadStatus,
        Last_Called_At: leadData.lastCalledAt,
        Call_Type: leadData.callType
      };

      const response = await axios.put(
        `${this.zohoApiUrl}/Leads/${leadId}`,
        { data: [zohoData] },
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.data?.[0]?.details?.id) {
        return response.data.data[0].details;
      }
      throw new Error('Failed to update lead in Zoho CRM');
    } catch (error) {
      this.logger.error(`Error updating lead in Zoho: ${error.message}`);
      throw error;
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