import axios from 'axios';
import { CallHistory } from '../types/call-history';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login page
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  contacted?: boolean;
  additionalInfo?: {
    callHistory?: any[];
    rawData?: {
      organization?: {
        phone?: string;
        primary_phone?: {
          number: string;
        };
        sanitized_phone?: string;
      };
      phone?: string;
    };
  };
  callHistoryRecords?: CallHistory[];
  lastCallRecord?: {
    id: string;
    callId: string;
    status: string;
    timestamp: string;
    lead_id: string;
  };
  industry: string;
  linkedinUrl: string;
  location: string;
  status: string;
  source: string;
  leadSource: string;
  machineryInterest?: string;
  machineryNotes?: string;
  hasSurplusMachinery?: boolean;
  machineryDetails?: {
    types?: string[];
    brands?: string[];
    condition?: string;
    age?: string;
    estimatedValue?: number;
  };
  createdAt: string;
  updatedAt: string;
  // Added fields for UI and backend compatibility
  scheduledCallbackDate?: string | null;
  linkClicked?: boolean;
  formSubmitted?: boolean;
}

export interface SearchParams {
  jobTitles?: string[];
  industries?: string[];
  locations?: string[];
  companySize?: string;
  keywords?: string;
  companyNames?: string[];
  limit?: number;
  page?: number;
  cronSchedule?: string;
  emailStatus?: string;
}

export interface ApolloConfig {
  apiKey?: string;
  defaultParameters: SearchParams;
  nextSyncAt?: string;
  lastSyncAt?: string;
  isActive?: boolean;
}

export interface ScheduleCallsParams {
  leadIds?: string[];
  allLeads?: boolean;
  priorityLeadsOnly?: boolean;
  fromNumber?: string;
  startTime?: string;
  endTime?: string;
}

export interface CallResponse {
  success: boolean;
  scheduled: number;
  skipped: number;
  errors: any[];
  callDetails: any[];
  scheduledTime?: string;
  endTime?: string;
  message?: string;
}

// Leads API
export const leadsApi = {
  getAll: async (
    page = 1, 
    limit = 10,
    filters?: { 
      status?: string;
      industry?: string;
      linkClicked?: string;
      formSubmitted?: string;
      reschedule?: string;
      search?: string;
      tab?: string;
    }
  ): Promise<{ data: Lead[]; pagination: { total: number; page: number; limit: number } }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Only add filters if they are defined
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.industry) {
      params.append('industry', filters.industry);
    }
    if (filters?.linkClicked) {
      params.append('linkClicked', filters.linkClicked);
    }
    if (filters?.formSubmitted) {
      params.append('formSubmitted', filters.formSubmitted);
    }
    if (filters?.reschedule) {
      params.append('reschedule', filters.reschedule);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.tab) {
      params.append('tab', filters.tab);
    }
    
    const response = await apiClient.get(`/leads?${params.toString()}`);
    return response.data;
  },

  getPriority: async (page = 1, limit = 10): Promise<{ data: Lead[]; pagination: { total: number; page: number; limit: number } }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await apiClient.get(`/leads?${params.toString()}`);
    return response.data;
  },

  getSurplusMachinery: async (page = 1, limit = 10): Promise<{ data: Lead[]; pagination: { total: number; page: number; limit: number } }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await apiClient.get(`/leads/surplus-machinery?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Lead> => {
    const response = await apiClient.get(`/leads/${id}`);
    return response.data;
  },
  sendEmail: async (id: string): Promise<Lead> => {
    const response = await apiClient.get(`/leads/email/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.patch(`/leads/${id}`, data);
    return response.data;
  },
  createLead: async ( data: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.post(`/leads`, data);
    return response.data;
  },

  updateMachineryInfo: async (id: string, data: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.patch(`/leads/${id}/machinery-info`, data);
    return response.data;
  },

  generate: async (options: {
    type?: string;
    count?: number;
    location?: string;
    industry?: string;
    jobTitle?: string;
  }): Promise<{ leads: Lead[]; stats: any }> => {
    const response = await apiClient.post('/leads/generate', options);
    return response.data;
  },

  fetchFromApollo: async (searchParams: SearchParams): Promise<{ leads: Lead[]; stats: any }> => {
    const response = await apiClient.post('/leads/apollo/search', searchParams);
    return response.data;
  },

  fetchMachineryOwners: async (customParams?: Partial<SearchParams>): Promise<{ leads: Lead[]; stats: any }> => {
    const response = await apiClient.post('/leads/apollo/machinery-owners', customParams);
    return response.data;
  },
  
  getCallHistory: async (leadId: string): Promise<{ callHistory: any[] }> => {
    const response = await apiClient.get(`/leads/${leadId}/call-history`);
    return response.data;
  },
  
  scheduleLeadCalls: async (params: ScheduleCallsParams): Promise<CallResponse> => {
    const response = await apiClient.post('/leads/call/schedule', params);
    return response.data;
  },
  
  callSingleLead: async (leadId: string, params: { 
    toNumber: string; 
    fromNumber?: string;
    override_agent_id?: string;
  }): Promise<CallResponse> => {
    const response = await apiClient.post(`/leads/call/single/${leadId}`, params);
    return response.data;
  },

  getCallDetail: async (callId: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/retell/call-detail/${callId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching call detail:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/leads/${id}`);
    return response.data;
  },

  deleteByPhoneNumber: async (phoneNumber: string): Promise<{ deletedCount: number; message: string }> => {
    const response = await apiClient.delete(`/leads/by-phone/${phoneNumber}`);
    return response.data;
  },
};

// Apollo Config API
export const apolloApi = {
  getStatus: async (): Promise<{ configured: boolean; message: string; nextSyncAt?: string; lastSyncAt?: string; cronSchedule?: string }> => {
    const response = await apiClient.get('/apollo/status');
    return response.data;
  },

  getConfig: async (): Promise<{ defaultParameters: SearchParams }> => {
    const response = await apiClient.get('/apollo/config');
    return response.data;
  },

  updateConfig: async (searchParams: SearchParams): Promise<{ updated: boolean; parameters: SearchParams }> => {
    const response = await apiClient.post('/apollo/config', searchParams);
    return response.data;
  },

  updateApiKey: async (apiKey: string): Promise<{ statusCode: number; message: string }> => {
    const response = await apiClient.patch('/apollo/api-key', { apiKey });
    return response.data;
  },

  syncNow: async (): Promise<any> => {
    const response = await apiClient.post('/apollo/sync/now');
    return response.data;
  },
};

// Combined API export
export const api = {
  ...leadsApi,
  ...apolloApi,

  async findOne(id: string): Promise<Lead> {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching lead:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch lead details');
    }
  },

  async getCallDashboard(filters?: {
    status?: string;
    dateRange?: { start: string; end: string };
    searchTerm?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      
      if (filters?.dateRange?.start) {
        queryParams.append('startDate', filters.dateRange.start);
      }
      
      if (filters?.dateRange?.end) {
        queryParams.append('endDate', filters.dateRange.end);
      }
      
      if (filters?.searchTerm) {
        queryParams.append('search', filters.searchTerm);
      }
      
      if (filters?.page) {
        queryParams.append('page', filters.page.toString());
      }
      
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }

      const response = await axios.get(
        `${API_BASE_URL}/leads/dashboard/calls?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching call dashboard:', error);
      throw error;
    }
  },

  async getCallById(callId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads/calls/${callId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("response", response.data)
      return response.data;
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw error;
    }
  },

  // Get all call history with pagination
  async getCallHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateRange?: { start: string; end: string };
  }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      
      if (params?.status && params.status !== 'all') {
        queryParams.append('status', params.status);
      }
      
      if (params?.dateRange?.start) {
        queryParams.append('startDate', params.dateRange.start);
      }
      
      if (params?.dateRange?.end) {
        queryParams.append('endDate', params.dateRange.end);
      }

      const response = await axios.get(
        `${API_BASE_URL}/leads/call-history?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
  },

  // Get all call history in descending order with enhanced pagination
  async getAllCallHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    name?: string;
    reschedule?: string;
    linkClicked?: string;
    formSubmitted?: string;
  }): Promise<{ 
    success: boolean;
    data: CallHistory[]; 
    pagination: { 
      total: number; 
      page: number; 
      limit: number; 
      totalPages: number; 
    } 
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      // Set defaults and validate parameters
      const page = Math.max(1, params?.page || 1);
      const limit = Math.min(100, Math.max(1, params?.limit || 50));
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (params?.status && params.status !== 'all' && params.status.trim() !== '') {
        queryParams.append('status', params.status.trim());
      }
      
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate);
      }

      if (params?.name && params.name.trim() !== '') {
        queryParams.append('name', params.name.trim());
      }

      if (params?.reschedule && params.reschedule !== 'all') {
        queryParams.append('reschedule', params.reschedule);
      }

      if (params?.linkClicked && params.linkClicked !== 'all') {
        queryParams.append('linkClicked', params.linkClicked);
      }

      if (params?.formSubmitted && params.formSubmitted !== 'all') {
        queryParams.append('formSubmitted', params.formSubmitted);
      }

      const response = await apiClient.get(
        `/leads/get/all-history?${queryParams.toString()}`
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all call history:', error);
      throw new Error(
        error?.response?.data?.message || 'Failed to fetch call history'
      );
    }
  },

  // Get detailed call information from Retell AI
  async getCallDetail(callId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/retell/call-detail/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching call detail from Retell AI:', error);
      throw error;
    }
  }
}; 