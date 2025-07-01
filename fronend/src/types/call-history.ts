export interface CallHistory {
  id?: string;
  callId?: string;
  call_id?: string;
  callType?: string;
  agentId?: string;
  status: string;
  startTimestamp: number;
  endTimestamp?: number;
  fromNumber: string;
  toNumber?: string;
  direction?: string;
  duration_ms?: number;
  disconnection_reason?: string;
  latency?: any;
  callCost?: {
    combined_cost: number;
    total_duration_seconds: number;
    total_duration_unit_price: number;
    product_costs: Array<{
      product: string;
      cost: number;
      unit_price: number;
    }>;
  };
  analytics?: {
    talkTime?: number;
    silenceTime?: number;
    leadTalkPercentage?: number;
    agentTalkPercentage?: number;
    interruptions?: number;
  };
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    keyPhrases?: string[];
    concerns?: string[];
    interests?: string[];
  };
  recording_url?: string;
  transcript?: string;
  transcript_object?: any[];
  transcript_with_tool_calls?: any[];
  public_log_url?: string;
  opt_out_sensitive_data_storage?: boolean;
  opt_in_signed_url?: boolean;
  
  // Lead information
  leadId?: string;
  leadName?: string;
  leadCompany?: string;
  leadJobTitle?: string;
  leadEmail?: string;
  leadPhone?: string;
} 