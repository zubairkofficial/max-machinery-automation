import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {  Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import axios from 'axios';
import { Not, IsNull } from 'typeorm';
import { CallTranscript } from '../retell/entities/call-transcript.entity';
import { ChatOpenAI } from '@langchain/openai';
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
  private readonly zohoApiUrl = 'https://www.zohoapis.com/crm/v2/Leads';
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
      const currentDate = new Date();
currentDate.setDate(currentDate.getDate() - 1); // Previous day

     const leads = await this.leadRepository
  .createQueryBuilder('lead')
  .where('lead.contacted = true')
   .andWhere('lead.linkSend = :linkSend', { linkSend: true })
   .andWhere('(lead.linkClicked = :linkClicked OR lead.formSubmitted = :formSubmitted)', { 
     linkClicked: false, 
     formSubmitted: false 
   })
  .select([
    'lead.id',
    'lead.zohoEmail',
    // پہلے zohoPhoneNumber، ورنہ lead.phone
    'COALESCE(lead.zohoPhoneNumber, lead.phone) AS phone',
    'lead.reminder',
    'lead.linkClicked',
    'lead.formSubmitted',
  ])
  .getRawMany();
// Now, `leads` will contain only leads that satisfy the given conditions and do not have an associated UserInfo

const todayStr = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD

for(const lead of leads) {

  try {
    const reminderStr = lead.lead_reminder
    ? new Date(lead.lead_reminder).toISOString().slice(0, 10)
    : null;

  const shouldCall = !reminderStr || reminderStr < todayStr;  // آج کی نہیں ہے؟

   if(shouldCall  ) await this.retellAiService.makeCallLeadZoho(lead,this.configService.get<string>('FROM_PHONE_NUMBER'), lead.lead_formSubmitted,lead.lead_linkClicked,this.configService.get<string>('AGENT_ID'));
  } catch (error) {
    this.logger.error(`Error processing lead ${lead.id}: ${error.message}`);
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
        const  leads = await this.getLeadsByPhoneNumber(userInfo.phone)
       let leadCount=leads.length
        // for(const lead of leads){
        // if(!lead?.Lead_Status){
        //  await axios.delete(
        //     `${this.zohoApiUrl}/${lead.id}`,
        //     {
        //       headers: {
        //         'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        //         'Content-Type': 'application/json'
        //       }
        //     }
        //   );
        // } else if(leadCount==2){
        //   await axios.put(`${this.zohoApiUrl}/${lead.id}`, {
        //     data: [
        //       {
        //         "Lead_Status": "Submitted",
        //       }
        //     ]
        //   });
        // }
        // }
        let foundInZoho = false;
          
          
          let foundLead=null
          
          if (!foundInZoho && userInfo.phone) {
             foundLead = await this.searchLeadInZohoByPhone(userInfo.phone);
            if (foundLead?.Phone) {
              foundInZoho = true;
              this.logger.log(`Found user in Zoho by phone: ${userInfo.phone}`);
              
              // Get lead with last call information
              const lead = await this.leadRepository.findOne({
                where: { id: userInfo.leadId },
                relations: ['lastCallRecord']
              });
              
              let transcript = "";
              let summary = "";
              
              // If lead has last call record, get call information from Retell AI
              if (lead?.lastCallRecord?.callId) {
                try {
                  const callDetail = await this.retellAiService.getCallDetail(lead.lastCallRecord.callId);
                  transcript = callDetail.transcript || "";
                  summary = callDetail.call_analysis?.call_summary || "";
                  this.logger.log(`Retrieved call information for callId: ${lead.lastCallRecord.callId}`);
                } catch (error) {
                  this.logger.error(`Error getting call detail for callId ${lead.lastCallRecord.callId}: ${error.message}`);
                }
              }
              
              // Update Zoho lead with transcript and summary
            try {
           const response =   await axios.put(`${this.zohoApiUrl}/${foundLead.id}`, {
                data: [
                  {
                    "Lead_Source": "Retell AI",
                    "Transcript": transcript,
                    "Summary": summary,
                  }
                ]
              }, {
                headers: {
                  Authorization: `Zoho-oauthtoken ${this.accessToken}`,
                }
              });
              this.logger.log(`Lead updated in Zoho: ${response.data}`);
            } catch (error) {
              this.logger.error(`Error updating lead in Zoho: ${error.message}`);
            }
            }
           
          }
          
          // If found in Zoho, update the status
          if (foundLead) {
            // foundLead?.Lead_Status==="Submitted"
           
            userInfo.contacted = true;
            await this.leadRepository.update(userInfo.leadId, {
              status: 'completed',
              formSubmitted:true,
              contacted: true,
              formSubmittedAt:new Date(),
              scheduledCallbackDate: null
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
    const response = await axios.get(`${this.zohoApiUrl}/search?criteria=(Email:equals:${lead.zohoEmail})`, {
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
    const response = await axios.post(`${this.zohoApiUrl}`, {
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


 async updateZohoLeadByPhon(lead, leadData) {
  try {
    await this.ensureValidAccessToken();

      const searchResponse = await axios.get(`${this.zohoApiUrl}/search?criteria=(Phone:equals:${lead.phone})`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
      }
    });

     if (searchResponse.data.data && searchResponse.data.data.length > 0) {
    const leadId = searchResponse.data.data[0].id; // Get the first matching lead

      // Step 2: Update the lead with new data (PUT request)
      const updateResponse = await axios.put(`${this.zohoApiUrl}/${leadId}`, {
        data: [
          {
           
            "Lead_Status": leadData || 'Link Clicked', // Default to 'Form Submitted' if no status provided
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
 async updateZohoLead(lead, leadData) {
  try {
    await this.ensureValidAccessToken();

      const searchResponse = await axios.get(`${this.zohoApiUrl}/search?criteria=(Email:equals:${lead.zohoEmail})`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
      }
    });

     if (searchResponse.data.data && searchResponse.data.data.length > 0) {
    const leadId = searchResponse.data.data[0].id; // Get the first matching lead

      // Step 2: Update the lead with new data (PUT request)
      const updateResponse = await axios.put(`${this.zohoApiUrl}/${leadId}`, {
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
      const response = await axios.get(`${this.zohoApiUrl}/search`, {
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



 

  private async updateLeadWithZohoData(userInfo: UserInfo): Promise<void> {
    try {
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
        `${this.zohoApiUrl}/search?criteria=${encodeURIComponent(searchCriteria)}`,
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
        Last_Name:leadData.lastName||leadData.firstName,
        Phone: leadData.phone,
        Email: leadData.email,
        Company: leadData.company,
        Industry: leadData.industry,
        Lead_Status: leadData.leadStatus,
        Description: leadData.description
      };

      const response = await axios.post(
        `${this.zohoApiUrl}`,
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
        `${this.zohoApiUrl}/${leadId}`,
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

  public async deleteLeadsFromZohoByPhone(phoneNumber: string): Promise<{ deletedCount: number; message: string }> {
    try {
      await this.ensureValidAccessToken();
      
      // First, search for leads with the given phone number
      const searchCriteria = `(Phone:equals:${phoneNumber})`;
      const searchResponse = await axios.get(
        `${this.zohoApiUrl}/search?criteria=${encodeURIComponent(searchCriteria)}`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!searchResponse.data?.data || searchResponse.data.data.length === 0) {
        return {
          deletedCount: 0,
          message: `No leads found in Zoho CRM with phone number: ${phoneNumber}`
        };
      }

      let deletedCount = 0;
      const errors: string[] = [];

      // Delete each lead found
      for (const lead of searchResponse.data.data) {
        try {
          const deleteResponse = await axios.delete(
            `${this.zohoApiUrl}/${lead.id}`,
            {
              headers: {
                'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (deleteResponse.status === 200 || deleteResponse.status === 204) {
            deletedCount++;
            this.logger.log(`Successfully deleted lead ${lead.id} from Zoho CRM`);
          }
        } catch (error) {
          const errorMsg = `Failed to delete lead ${lead.id}: ${error.response?.data?.message || error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const message = deletedCount > 0 
        ? `Successfully deleted ${deletedCount} leads from Zoho CRM with phone number: ${phoneNumber}`
        : `No leads were deleted from Zoho CRM with phone number: ${phoneNumber}`;

      if (errors.length > 0) {
        this.logger.warn(`Some errors occurred during deletion: ${errors.join(', ')}`);
      }

      return {
        deletedCount,
        message: errors.length > 0 ? `${message}. Errors: ${errors.join(', ')}` : message
      };
    } catch (error) {
      this.logger.error(`Error deleting leads from Zoho CRM by phone number ${phoneNumber}: ${error.message}`);
      throw error;
    }
  }

  async  getLeadsByPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        this.logger.warn('Phone number is missing, skipping Zoho search.');
        return []; // Return an empty array if no phone number is provided
    }

    try {
        const searchCriteria = `(Phone:equals:${phoneNumber})`;
        const searchUrl = `https://www.zohoapis.com/crm/v2/Leads/search?criteria=${encodeURIComponent(searchCriteria)}`;

        const searchResponse = await axios.get(searchUrl, {
            headers: {
                Authorization: `Zoho-oauthtoken ${this.accessToken}`,
            }
        });

        const foundLeads = searchResponse.data.data;

        if (foundLeads && foundLeads.length > 0) {
            this.logger.log(`Found ${foundLeads.length} leads in Zoho with phone: ${phoneNumber}`);
            return foundLeads;
        } else {
            this.logger.log(`No leads found in Zoho with phone: ${phoneNumber}`);
            return []; // Return an empty array if no leads are found
        }
    } catch (error) {
        this.logger.error(`Error searching Zoho Leads by phone ${phoneNumber}:`, error);
        throw error; // Re-throw for further error handling upstream
    }
}

} 