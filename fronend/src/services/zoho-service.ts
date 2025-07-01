// This service handles integration with Zoho CRM for lead and call data synchronization

export interface ZohoLead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  title: string
  industry: string
  status: string
  source: string
  lastContactedDate?: string
  notes?: string
}

export interface ZohoCall {
  id: string
  leadId: string
  subject: string
  status: string
  startTime: string
  endTime?: string
  duration?: string
  notes?: string
}

class ZohoService {
  private apiKey: string | null = null

  constructor() {
    // In a real app, this would be loaded from environment variables
    this.apiKey = null
  }

  setApiKey(key: string) {
    this.apiKey = key
  }

  async syncLead(lead: any): Promise<ZohoLead> {
    if (!this.apiKey) {
      throw new Error("Zoho API key not set")
    }

    // In a real app, this would make an API call to Zoho CRM
    // For demo purposes, we'll return mock data
    return {
      id: `zoho-${Date.now()}`,
      firstName: lead.firstName || lead.name?.split(" ")[0] || "",
      lastName: lead.lastName || lead.name?.split(" ").slice(1).join(" ") || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || lead.leadCompany || "",
      title: lead.title || lead.position || "",
      industry: lead.industry || "Manufacturing",
      status: lead.status || "New",
      source: lead.source || "MachineryMax Automation",
      lastContactedDate: new Date().toISOString(),
      notes: lead.notes || "",
    }
  }

  async syncCall(call: any): Promise<ZohoCall> {
    if (!this.apiKey) {
      throw new Error("Zoho API key not set")
    }

    // In a real app, this would make an API call to Zoho CRM
    // For demo purposes, we'll return mock data
    return {
      id: `zoho-call-${Date.now()}`,
      leadId: call.leadId,
      subject: `Call with ${call.leadName || "Lead"} from ${call.leadCompany || "Company"}`,
      status: call.status === "completed" ? "Completed" : call.status === "failed" ? "Failed" : "Scheduled",
      startTime: call.startTime || call.scheduledTime || new Date().toISOString(),
      endTime: call.endTime,
      duration: call.duration,
      notes: call.notes || "",
    }
  }

  async getLeads(): Promise<ZohoLead[]> {
    if (!this.apiKey) {
      throw new Error("Zoho API key not set")
    }

    // In a real app, this would make an API call to Zoho CRM
    // For demo purposes, we'll return mock data
    return Array.from({ length: 10 }, (_, i) => ({
      id: `zoho-${i + 1}`,
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      email: `contact${i + 1}@company${i + 1}.com`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      company: `Company ${i + 1}`,
      title: ["CEO", "CTO", "COO", "CFO", "Owner"][Math.floor(Math.random() * 5)],
      industry: "Manufacturing",
      status: ["New", "Contacted", "Qualified", "Converted", "Closed"][Math.floor(Math.random() * 5)],
      source: ["Apollo.io", "Manual Entry", "Website", "Referral", "Trade Show"][Math.floor(Math.random() * 5)],
      lastContactedDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      notes: Math.random() > 0.5 ? "Interested in selling equipment. Follow up next week." : undefined,
    }))
  }
}

export const zohoService = new ZohoService()
