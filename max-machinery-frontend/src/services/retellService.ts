import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const retellService = {
  updateAgentPrompt: async (agentId: string, prompt: string) => {
    try {
      const response = await axios.patch(`${API_URL}/retell/agent/prompt`, {
        agentId,
        prompt
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 