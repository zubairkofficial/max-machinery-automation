import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LeadCallsService } from './lead_calls.service';
import { CreateLeadCallDto } from './dto/create-lead_call.dto';
import { UpdateLeadCallDto } from './dto/update-lead_call.dto';

@Controller('lead-calls')
export class LeadCallsController {
  constructor(private readonly leadCallsService: LeadCallsService) {}

 
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadCallsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadCallDto: UpdateLeadCallDto) {
    return this.leadCallsService.update(+id, updateLeadCallDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadCallsService.remove(+id);
  }
}
