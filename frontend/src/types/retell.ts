export interface RetellTool {
  name: string;
  description: string;
  type: string;
  number?: string;
  transfer_destination?: {
    type: string;
    number: string;
  };
  transfer_option?: {
    type: string;
  };
}

export interface RetellLLMResponse {
  agentId: string;
  version: number;
  model: string;
  model_temperature: number;
  model_high_priority: boolean;
  tool_call_strict_mode: boolean;
  general_prompt: string;
  general_tools: RetellTool[];
  last_modification_timestamp: number;
  is_published: boolean;
} 