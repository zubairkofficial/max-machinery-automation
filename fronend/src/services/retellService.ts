import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const retellService = {
  async getRetellLLM(llmId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/retell/llm/${llmId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Retell LLM:', error);
      throw error;
    }
  },

  async updateRetellLLM(llmId: string, prompt: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/retell/llm/${llmId}/update`, {
        prompt,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating Retell LLM:', error);
      throw error;
    }
  },
}; 