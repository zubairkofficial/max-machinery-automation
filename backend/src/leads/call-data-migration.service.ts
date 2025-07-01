import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CallHistory } from './entities/call-history.entity';
import { LastCall } from './entities/last-call.entity';
import { Not, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CallDataMigrationService {
  private readonly logger = new Logger(CallDataMigrationService.name);

  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(LastCall)
    private lastCallRepository: Repository<LastCall>,
    private configService: ConfigService,
  ) {}

  async migrateCallData(): Promise<void> {
    try {
      this.logger.log('Starting call data migration...');

      // Get all leads with call history in additionalInfo
      const leads = await this.leadsRepository.find({
        where: {
          additionalInfo: {
            callHistory: Not(IsNull())
          }
        }
      });

      this.logger.log(`Found ${leads.length} leads with call history to migrate`);

      for (const lead of leads) {
        try {
          const callHistory = lead.additionalInfo?.callHistory || [];
          
          // Skip if no call history
          if (!callHistory.length) {
            continue;
          }

          // Create call history records
          for (const call of callHistory) {
            const callHistoryRecord = this.callHistoryRepository.create({
              lead_id: lead.id,
              callId: call.callId || `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              callType: call.callType || 'phone_call',
              agentId: call.agentId || this.configService.get<string>('AGENT_ID'),
              status: call.status || 'completed',
              startTimestamp: new Date(call.callTime).getTime(),
              endTimestamp: call.endTimestamp || new Date(call.callTime).getTime() + 300000, // Add 5 minutes if no end time
              fromNumber: call.fromNumber,
              toNumber: call.toNumber,
              direction: call.direction || 'outbound',
              telephonyIdentifier: call.telephonyIdentifier || null,
              callQuality: call.callQuality || null,
              analytics: call.analytics || null,
              sentiment: call.sentiment || null,
              latency: call.latency || null,
              callCost: call.callCost || null
            });

            await this.callHistoryRepository.save(callHistoryRecord);
          }

          // Create or update last call record
          const lastCall = callHistory[callHistory.length - 1];
          if (lastCall) {
            const lastCallRecord = this.lastCallRepository.create({
              lead_id: lead.id,
              callId: lastCall.callId || `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              status: lastCall.status || 'completed',
              timestamp: new Date(lastCall.callTime).getTime()
            });

            await this.lastCallRepository.save(lastCallRecord);
          }

          // Update lead's additionalInfo to mark migration
          lead.additionalInfo = {
            ...lead.additionalInfo,
            callHistoryMigrated: true,
            callHistoryMigratedAt: new Date().toISOString()
          };

          await this.leadsRepository.save(lead);

          this.logger.log(`Successfully migrated call data for lead ${lead.id}`);
        } catch (error) {
          this.logger.error(`Failed to migrate call data for lead ${lead.id}: ${error.message}`);
          // Continue with next lead even if one fails
          continue;
        }
      }

      this.logger.log('Call data migration completed');
    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`);
      throw error;
    }
  }
} 