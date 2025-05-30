// This service handles email and SMS communication for follow-ups

export interface Communication {
  id: string
  leadId: string
  leadName: string
  leadCompany: string
  type: "email" | "sms"
  status: "pending" | "sent" | "delivered" | "failed"
  scheduledTime: string
  sentTime?: string
  content: string
  response?: string
  templateId?: string
}

class CommunicationService {
  private emailApiKey: string | null = null
  private smsApiKey: string | null = null

  constructor() {
    // In a real app, this would be loaded from environment variables
    this.emailApiKey = null
    this.smsApiKey = null
  }

  setEmailApiKey(key: string) {
    this.emailApiKey = key
  }

  setSmsApiKey(key: string) {
    this.smsApiKey = key
  }

  async scheduleEmail(
    leadId: string,
    leadName: string,
    leadCompany: string,
    email: string,
    content: string,
    scheduledTime: string,
    templateId?: string,
  ): Promise<Communication> {
    if (!this.emailApiKey) {
      throw new Error("Email API key not set")
    }

    // In a real app, this would make an API call to an email service like SendGrid
    // For demo purposes, we'll return mock data
    return {
      id: `email-${Date.now()}`,
      leadId,
      leadName,
      leadCompany,
      type: "email",
      status: "pending",
      scheduledTime,
      content,
      templateId,
    }
  }

  async scheduleSms(
    leadId: string,
    leadName: string,
    leadCompany: string,
    phone: string,
    content: string,
    scheduledTime: string,
    templateId?: string,
  ): Promise<Communication> {
    if (!this.smsApiKey) {
      throw new Error("SMS API key not set")
    }

    // In a real app, this would make an API call to an SMS service like Twilio
    // For demo purposes, we'll return mock data
    return {
      id: `sms-${Date.now()}`,
      leadId,
      leadName,
      leadCompany,
      type: "sms",
      status: "pending",
      scheduledTime,
      content,
      templateId,
    }
  }

  async sendNow(communicationId: string): Promise<Communication> {
    // In a real app, this would make an API call to send the communication immediately
    // For demo purposes, we'll return mock data
    return {
      id: communicationId,
      leadId: "mock-lead-id",
      leadName: "Mock Lead",
      leadCompany: "Mock Company",
      type: Math.random() > 0.5 ? "email" : "sms",
      status: "sent",
      scheduledTime: new Date().toISOString(),
      sentTime: new Date().toISOString(),
      content:
        "Thank you for your time on our call. As discussed, I wanted to follow up about your surplus machinery...",
    }
  }

  async getCommunications(): Promise<Communication[]> {
    // In a real app, this would make an API call to get all communications
    // For demo purposes, we'll return mock data
    return Array.from({ length: 20 }, (_, i) => ({
      id: `comm-${i + 1}`,
      leadId: `lead-${i + 1}`,
      leadName: `Contact ${i + 1}`,
      leadCompany: `Company ${i + 1}`,
      type: Math.random() > 0.5 ? "email" : "sms",
      status: ["pending", "sent", "delivered", "failed"][Math.floor(Math.random() * 4)] as any,
      scheduledTime: new Date(Date.now() + Math.floor(Math.random() * 7 * 24) * 60 * 60 * 1000).toISOString(),
      sentTime:
        Math.random() > 0.5
          ? new Date(Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000).toISOString()
          : undefined,
      content:
        "Thank you for your time on our call. As discussed, I wanted to follow up about your surplus machinery...",
      response: Math.random() > 0.7 ? "Thanks for reaching out. I am interested in discussing further..." : undefined,
      templateId: Math.random() > 0.5 ? `template-${Math.floor(Math.random() * 5) + 1}` : undefined,
    }))
  }

  async getTemplates(): Promise<any[]> {
    // In a real app, this would make an API call to get all templates
    // For demo purposes, we'll return mock data
    return [
      {
        id: "template-1",
        name: "Initial Follow-up",
        type: "email",
        subject: "Following up on our conversation about your surplus machinery",
        content:
          "Dear {{lead_name}},\n\nThank you for taking the time to speak with me today about your surplus industrial machinery at {{company_name}}.\n\nAs discussed, MachineryMax specializes in helping businesses like yours sell unused or underutilized equipment. Based on our conversation, I believe we could help you convert your surplus {{machinery_type}} into cash quickly and efficiently.\n\nWould you be available for a brief follow-up call this week to discuss the next steps? Alternatively, you can send me photos and details of the equipment you're looking to sell, and I can provide a preliminary valuation.\n\nLooking forward to working with you.\n\nBest regards,\n{{agent_name}}\nMachineryMax\n{{agent_phone}}\n{{agent_email}}",
      },
      {
        id: "template-2",
        name: "Second Follow-up",
        type: "email",
        subject: "Checking in about your machinery at {{company_name}}",
        content:
          "Dear {{lead_name}},\n\nI wanted to follow up on our previous conversation about the surplus machinery at your facility. I understand you're busy, but I wanted to remind you of the opportunity to convert unused equipment into capital that could be reinvested in your business.\n\nMachineryMax has successfully helped many businesses in the {{industry}} industry sell their equipment quickly and at competitive prices.\n\nHas there been any further thought about selling your {{machinery_type}} equipment? I'm happy to answer any questions or provide more information about our process.\n\nBest regards,\n{{agent_name}}\nMachineryMax\n{{agent_phone}}\n{{agent_email}}",
      },
      {
        id: "template-3",
        name: "Initial SMS Follow-up",
        type: "sms",
        content:
          "Hi {{lead_name}}, this is {{agent_name}} from MachineryMax. Thanks for our call today about your surplus machinery. Would you like to schedule a follow-up call to discuss next steps? Reply YES and I'll send some available times.",
      },
      {
        id: "template-4",
        name: "Second SMS Follow-up",
        type: "sms",
        content:
          "Hi {{lead_name}}, just checking in about the surplus machinery we discussed. MachineryMax can help you convert that equipment to cash quickly. Interested in learning more? Reply YES and I'll call you.",
      },
      {
        id: "template-5",
        name: "Call Script - Initial Contact",
        type: "call",
        content:
          "Hello, this is {{agent_name}} from MachineryMax. Am I speaking with {{lead_name}}? [Wait for confirmation]\n\nGreat! I'm calling because MachineryMax specializes in helping businesses sell their surplus industrial machinery. We've helped many companies in the {{industry}} industry convert unused equipment into cash.\n\nDo you currently have any unused or underutilized machinery in your facility? [Wait for response]\n\n[If yes] That's great to hear. Could you tell me a bit more about the equipment? What type of machinery is it, and how long has it been unused? [Wait for response]\n\n[If no] I understand. Many businesses don't realize they have valuable assets sitting idle. Would you mind if I ask what types of machinery you use in your operations? Sometimes there are opportunities to upgrade and sell older models. [Wait for response]\n\nThank you for sharing that information. Based on what you've told me, I believe MachineryMax could help you [benefit specific to their situation]. Would you be interested in receiving more information about our services via email? [Wait for response]\n\n[If yes] Excellent! I'll send that over right away. Also, would it be helpful to schedule a follow-up call next week after you've had a chance to review the information? [Schedule if interested]\n\n[If no] I understand. Would it be alright if I check back with you in a few months? Your equipment needs may change, and we're always here to help when you're ready.\n\nThank you for your time today, {{lead_name}}. Have a great day!",
      },
    ]
  }
}

export const communicationService = new CommunicationService()
