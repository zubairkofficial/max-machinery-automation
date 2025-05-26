import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetellService } from './retell.service';
import { RetellController } from './retell.controller';
import { CallHistory } from '../leads/entities/call-history.entity';
import { Lead } from '../leads/entities/lead.entity';
import { LeadsModule } from '../leads/leads.module';
import { CallTranscript } from './entities/call-transcript.entity';
import { LastCall } from '../leads/entities/last-call.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallHistory, Lead, CallTranscript, LastCall]),
    forwardRef(() => LeadsModule),
    ConfigModule
  ],
  controllers: [RetellController],
  providers: [RetellService],
  exports: [RetellService],
})
export class RetellModule {}
