import axios from 'axios';
import { CallHistory } from '../types/call-history';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
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

export class CallService {
  static async getCallById(callId: string): Promise<CallHistory> {
    try {
      const response = await apiClient.get(`/leads/calls/${callId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching call details:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch call details');
    }
  }

  static async getCallsByLeadId(leadId: string): Promise<CallHistory[]> {
    try {
      const response = await apiClient.get(`/leads/${leadId}/calls`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching lead calls:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch lead calls');
    }
  }

  static async getLastCallByLeadId(leadId: string): Promise<CallHistory | null> {
    try {
      const response = await apiClient.get(`/leads/${leadId}/last-call`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching last call:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch last call');
    }
  }
} 