import axios from "axios";

export async function updateZohoLead(leadId, leadData) {
  try {
    const response = await axios.put(`https://www.zohoapis.com/crm/v2/Leads/${leadId}`, {
      data: [
        {
          "First_Name": leadData.firstName,
          "Last_Name": leadData.lastName,
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