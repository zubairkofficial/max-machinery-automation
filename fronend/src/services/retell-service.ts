// This service handles integration with Retell AI for automated calling

import axios from 'axios';
import { apiClient } from './api-client';

export interface RetellCall {
  id: string;
  call_id: string;
  call_type: string;
  agent_id: string;
  call_status: string;
  start_timestamp: number;
  end_timestamp?: number;
  duration_ms?: number;
  from_number: string;
  to_number: string;
  direction: string;
  disconnection_reason?: string;
  recording_url?: string;
  transcript?: string;
  transcript_object?: any[];
  transcript_with_tool_calls?: any[];
  public_log_url?: string;
  call_cost?: {
    combined_cost: number;
    total_duration_seconds: number;
    total_duration_unit_price: number;
    product_costs: Array<{
      product: string;
      cost: number;
      unit_price: number;
    }>;
  };
  call_analysis?: {
    in_voicemail: boolean;
    call_summary: string;
    user_sentiment: string;
    custom_analysis_data: {
      talkTime?: number;
      silenceTime?: number;
      leadTalkPercentage?: number;
      agentTalkPercentage?: number;
      interruptions?: number;
    };
    call_successful: boolean;
  };
  opt_out_sensitive_data_storage: boolean;
  opt_in_signed_url: boolean;
  metadata?: {
    lead_id?: string;
    [key: string]: any;
  };
}

export const retellService = {
  async getCalls(): Promise<RetellCall[]> {
    try {
      const response = await fetch('/api/retell/calls');
      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching calls:', error);
      throw error;
    }
  },

  async getCallById(callId: string): Promise<RetellCall> {
    try {
      const response = await fetch(`/api/retell/calls/${callId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch call');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching call:', error);
      throw error;
    }
  },

  getCallHistory: async (leadId: string): Promise<RetellCall[]> => {
    try {
      const response = await apiClient.get(`/leads/calls/history/${leadId}`);
      return response.data.callHistory;
    } catch (error: any) {
      console.error('Error fetching call history:', error.response?.data || error.message);
      throw new Error('Failed to fetch call history');
    }
  }
};

// Also export as default for components that want to import it that way
export default retellService;
