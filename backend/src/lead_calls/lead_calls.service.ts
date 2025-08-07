import { Injectable } from '@nestjs/common';
import { CreateLeadCallDto } from './dto/create-lead_call.dto';
import { UpdateLeadCallDto } from './dto/update-lead_call.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadCall } from './entities/lead_call.entity';
import { JobName } from 'src/cron-settings/enums/job-name.enum';

@Injectable()
export class LeadCallsService {
  constructor(
    @InjectRepository(LeadCall)
    private leadCallRepository: Repository<LeadCall>,
  ) {}

  // Method to create or update lead call count
 async countScheduledCalls(count: number, jobName: JobName) {
  try {
    // Fetch the existing lead call record, if any
    let leadCall = await this.getAllLeadCalls();  // You can modify the condition to suit your needs

    if (!leadCall) {
      // If no record is found, create a new one with initialized counts
      leadCall = this.leadCallRepository.create({
        scheduledCallCount: 0,  // Initialize the scheduled call count
        rescheduledCallCount: 0,  // Initialize the rescheduled call count
        reminderCallCount: 0,  // Initialize the reminder call count
      });
    }

    // Increment the respective call count based on JobName
    switch (jobName) {
      case JobName.SCHEDULED_CALLS:
        leadCall.scheduledCallCount += count;
        break;
      case JobName.RESCHEDULE_CALL:
        leadCall.rescheduledCallCount += count;
        break;
      case JobName.REMINDER_CALL:
        leadCall.reminderCallCount += count;
        break;
      default:
        throw new Error('Unknown JobName');
    }

    // Save the updated lead call record
    return await this.leadCallRepository.save(leadCall);
  } catch (error) {
    console.error('Error creating/updating lead call count:', error);
    throw new Error('Failed to update lead call count');
  }
}


  async getAllLeadCalls() {
    let [leadCall] = await this.leadCallRepository.find();
    return leadCall;
  }

  findOne(id: number) {
    return `This action returns a #${id} leadCall`;
  }

  update(id: number, updateLeadCallDto: UpdateLeadCallDto) {
    return `This action updates a #${id} leadCall`;
  }

  remove(id: number) {
    return `This action removes a #${id} leadCall`;
  }
}
