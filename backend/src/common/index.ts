import axios from "axios";

export async function updateZohoLead(leadId, leadData) {
  try {
    const response = await axios.put(`https://www.zohoapis.com/crm/v2/Leads/${leadId}`, {
      data: [
        {
          "First_Name": leadData.firstName,
          // "Last_Name": leadData.lastName,
          "Email": leadData.email,
          "Phone": leadData.phone,
          "Lead_Status": 'Form Submitted',
        }
      ]
    }, {
      headers: {
        // Authorization: `Zoho-oauthtoken ${zohoAccessToken}`,
      }
    });
    console.log('Lead updated in Zoho CRM:', response.data);
  } catch (error) {
    console.error('Error updating lead in Zoho CRM:', error.message);
  }}

  export function cleanPhoneNumber(phone: string): string {
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