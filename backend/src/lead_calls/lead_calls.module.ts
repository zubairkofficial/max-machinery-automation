import { Module } from '@nestjs/common';
import { LeadCallsService } from './lead_calls.service';
import { LeadCallsController } from './lead_calls.controller';
import { LeadCall } from './entities/lead_call.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[
     TypeOrmModule.forFeature([LeadCall])
  ],
  controllers: [LeadCallsController],
  providers: [LeadCallsService],
    exports: [LeadCallsService],
})
export class LeadCallsModule {}
