import axios from 'axios';

export interface CronSetting {
  id: string;
  jobName: string;
  description: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  startTime?: string | null;
  endTime?: string | null;
}

export interface UpdateCronSettingDto {
  isEnabled?: boolean;
  startTime?: string;
  endTime?: string;
}
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
class CronService {
  async getCronSettings(): Promise<CronSetting[]> {
    const response = await apiClient.get('/cron-settings');
    return response.data;
  }

  async updateCronSetting(jobName: string, data: UpdateCronSettingDto): Promise<CronSetting> {
    const response = await apiClient.patch(`/cron-settings/${jobName}`, data);
    return response.data;
  }

  async createCronSetting(data: Omit<UpdateCronSettingDto, 'jobName'> & { jobName: string }): Promise<CronSetting> {
    const response = await apiClient.post('/cron-settings', data);
    return response.data;
  }
}

export const cronService = new CronService(); 