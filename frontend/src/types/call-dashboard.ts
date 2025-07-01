export interface CallDashboardFilters {
  status: string;
  dateRange: {
    start: string;
    end: string;
  };
  searchTerm: string;
  page: number;
  limit: number;
}

export interface CallCost {
  combined_cost: number;
  total_duration_seconds: number;
  product_costs?: Array<{
    product: string;
    cost: number;
  }>;
}

export interface CallRecord {
  id: string;
  callId: string;
  status: string;
  startTimestamp: string | number;
  endTimestamp?: string | number;
  duration_ms?: number;
  fromNumber: string;
  toNumber: string;
  callCost?: CallCost;
}

export interface CallDashboardLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string;
  jobTitle: string;
  industry: string | null;
  linkedinUrl: string;
  location: string | null;
  additionalInfo: {
    rawData: {
      id: string;
      city: string;
      name: string;
      email: string;
      state: string;
      title: string;
      country: string;
      headline: string;
      functions: string[];
      last_name: string;
      photo_url: string;
      seniority: string;
      first_name: string;
      github_url: string | null;
      departments: string[];
      show_intent: boolean;
      twitter_url: string | null;
      email_status: string;
      facebook_url: string | null;
      linkedin_url: string;
      organization: {
        id: string;
        name: string;
        phone: string;
        logo_url: string;
        twitter_url: string;
        website_url: string;
        founded_year: number;
        linkedin_uid: string;
        linkedin_url: string;
        alexa_ranking: number;
        primary_phone: {
          number: string;
          source: string;
          sanitized_number: string;
        };
        primary_domain: string;
        sanitized_phone: string;
        organization_headcount_six_month_growth: number;
        organization_headcount_twelve_month_growth: number;
        organization_headcount_twenty_four_month_growth: number;
      };
    };
  };
  contacted: boolean;
  status: string;
  source: string;
  leadSource: string;
  leadId: string;
  machineryInterest: string | null;
  machineryNotes: string | null;
  updatedAt: string;
  callHistoryRecords: CallRecord[];
  lastCallRecord: CallRecord | null;
}

export interface CallDashboardStatistics {
  totalLeads: number;
  contactedLeads: number;
  contactRate: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  callSuccessRate: number;
  averageCallDuration: number;
  averageCallCost: number;
}

export interface CallDashboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CallDashboardData {
  leads: CallDashboardLead[];
  statistics: CallDashboardStatistics;
  pagination: CallDashboardPagination;
} 