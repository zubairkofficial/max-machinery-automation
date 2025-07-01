// This service handles integration with Apollo.io for lead management

export interface ApolloLead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  title: string
  industry: string
  location: string
  source: string
  createdAt: string
}

class ApolloService {
  private apiKey: string | null = null

  constructor() {
    // In a real app, this would be loaded from environment variables
    this.apiKey = null
  }

  setApiKey(key: string) {
    this.apiKey = key
  }

  async searchLeads(criteria: any): Promise<ApolloLead[]> {
    if (!this.apiKey) {
      throw new Error("Apollo API key not set")
    }

    // In a real app, this would make an API call to Apollo.io
    // For demo purposes, we'll return mock data
    return this.getMockLeads()
  }

  async importLeads(criteria: any): Promise<ApolloLead[]> {
    if (!this.apiKey) {
      throw new Error("Apollo API key not set")
    }

    // In a real app, this would make an API call to Apollo.io
    // For demo purposes, we'll return mock data
    return this.getMockLeads()
  }

  private getMockLeads(): ApolloLead[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `apollo-${i + 1}`,
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      email: `contact${i + 1}@company${i + 1}.com`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      company: `Company ${i + 1}`,
      title: ["CEO", "CTO", "COO", "CFO", "Owner"][Math.floor(Math.random() * 5)],
      industry: "Manufacturing",
      location: "United States",
      source: "Apollo.io",
      createdAt: new Date().toISOString(),
    }))
  }
}

export const apolloService = new ApolloService()
