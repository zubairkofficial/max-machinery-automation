import { apiClient } from './api';
import { JobName } from '../types/job-name.enum';

export interface CronSetting {
  id: string;
  jobName: JobName;
  description: string;
  isEnabled: boolean;
  startTime: string | null;
  endTime: string | null;
  runDate: string | null;
  selectedDays: number;
  callLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCronSettingDto {
  isEnabled?: boolean;
  startTime?: string;
  endTime?: string;
  runDate?: string;
  selectedDays?: number;
  callLimit?: number;
}

export interface LeadCallData {
  scheduledCallCount: number;
  rescheduledCallCount: number;
  reminderCallCount: number;
}

export interface CronSettingsResponse {
  cronSettings: CronSetting[];
  leadCallData: LeadCallData;
}

class CronService {
  async getCronSettings(): Promise<CronSetting[]> {
    const response = await apiClient.get<CronSettingsResponse>('/cron-settings');
    return response.data.cronSettings;
  }

  async getCronSettingsWithLeadData(): Promise<CronSettingsResponse> {
    const response = await apiClient.get<CronSettingsResponse>('/cron-settings');
    return response.data;
  }

  async updateCronSetting(jobName: JobName, updateDto: UpdateCronSettingDto): Promise<CronSetting> {
    const response = await apiClient.patch<CronSetting>(`/cron-settings/${jobName}`, updateDto);
    return response.data;
  }

  async createCronSetting(createDto: { jobName: JobName } & UpdateCronSettingDto): Promise<CronSetting> {
    const response = await apiClient.post<CronSetting>('/cron-settings', createDto);
    return response.data;
  }
}

export const cronService = new CronService(); 