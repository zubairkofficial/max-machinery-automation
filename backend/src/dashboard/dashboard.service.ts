import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
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
      // Get today's date range in UTC
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const [
        totalLeads,
        todaysCalls,
        pendingCalls,
        completedCalls,
        interestedLeads,
        notInterestedLeads,
        rescheduledLeads,
        reminderLeads,
        completedLeads,
      ] = await Promise.all([
        // Total leads count
        this.leadRepository.count(),
        
        // Today's calls (calls made today)
        this.callHistoryRepository
          .createQueryBuilder('call')
          .where('call.createdAt >= :startOfDay', { startOfDay })
          .andWhere('call.createdAt < :endOfDay', { endOfDay })
          .getCount(),
        
        // Pending calls (leads that haven't been contacted yet)
        this.leadRepository.count({ 
          where: { contacted: false } 
        }),
        
        // Completed calls (calls that ended successfully)
        this.callHistoryRepository.count({ 
          where: {
            duration_ms: MoreThan(0),}
        }),

        // Lead status counts
        this.leadRepository.count({ 
          where: { status: 'interested' } 
        }),
        
        this.leadRepository.count({ 
          where: { notInterested: true } 
        }),
        
        this.leadRepository
          .createQueryBuilder('lead')
          .where('lead.scheduledCallbackDate IS NOT NULL')
          .getCount(),
        
        this.leadRepository
          .createQueryBuilder('lead')
          .where('lead.reminder IS NOT NULL')
          .getCount(),
        
        this.leadRepository.count({ 
          where: { status: 'completed' } 
        }),
      ]);

      return {
        totalLeads,
        todaysCalls,
        pendingCalls,
        completedCalls,
        interestedLeads,
        notInterestedLeads,
        rescheduledLeads,
        reminderLeads,
        completedLeads,
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