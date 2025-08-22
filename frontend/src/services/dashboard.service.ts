import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

export interface DashboardStats {
  totalLeads: number;
  todaysCalls: number;
  scheduledCall: number;
  rescheduledCall: number;
  reminderCall: number;
  pendingCalls: number;
  completedCalls: number;
  interestedLeads: number;
  notInterestedLeads: number;
  rescheduledLeads: number;
  reminderLeads: number;
  completedLeads: number;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'lead';
  description: string;
  timestamp: string;
}

export interface UpcomingCall {
  id: string;
  companyName: string;
  scheduledTime: string;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getRecentActivity(): Promise<Activity[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/recent-activity`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  async getUpcomingCalls(): Promise<UpcomingCall[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/upcoming-calls`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming calls:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService(); 