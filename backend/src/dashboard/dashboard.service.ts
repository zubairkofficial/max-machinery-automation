import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../leads/entities/lead.entity';
import { CallHistory } from '../leads/entities/call-history.entity';
import { LastCall } from '../leads/entities/last-call.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(CallHistory)
    private readonly callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(LastCall)
    private readonly lastCallRepository: Repository<LastCall>,
  ) {}

  async getStats() {
    try {
      const [
        totalLeads,
        activeCalls,
        completedCalls,
        pendingFollowUps,
        successfulConversions,
      ] = await Promise.all([
        this.leadRepository.count(),
        this.lastCallRepository.count({ where: { status: 'active' } }),
        this.callHistoryRepository.count({ where: { status: 'ended' } }),
        this.leadRepository.count({ where: { contacted: false } }),
        this.leadRepository.count({ where: { status: 'converted' } }),
      ]);

      return {
        totalLeads,
        activeCalls,
        completedCalls,
        pendingFollowUps,
        successfulConversions,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getRecentActivity() {
    try {
      // Get recent calls
      const recentCalls = await this.callHistoryRepository.find({
        order: { createdAt: 'DESC' },
        take: 3,
        relations: ['lead'],
      });

      // Get recent leads
      const recentLeads = await this.leadRepository.find({
        order: { createdAt: 'DESC' },
        take: 2,
      });

      const activities = [
        ...recentCalls.map(call => ({
          id: call.id,
          type: 'call',
          description: `Call ${call.status} with ${call.lead?.company || 'Unknown Company'}`,
          timestamp: call.createdAt.toISOString(),
        })),
        ...recentLeads.map(lead => ({
          id: lead.id,
          type: 'lead',
          description: `New lead added: ${lead.company || 'Unknown Company'}`,
          timestamp: lead.createdAt.toISOString(),
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 5);

      return activities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  async getUpcomingCalls() {
    try {
      const upcomingCalls = await this.lastCallRepository.find({
        where: { status: 'scheduled' },
        order: { createdAt: 'ASC' },
        take: 5,
        relations: ['lead'],
      });

      return upcomingCalls.map(call => ({
        id: call.id,
        companyName: call.lead?.company || 'Unknown Company',
        scheduledTime: call.timestamp.toString(),
      }));
    } catch (error) {
      console.error('Error fetching upcoming calls:', error);
      throw error;
    }
  }
} 