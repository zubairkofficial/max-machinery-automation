import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ValidationPipe, 
  UsePipes, 
  UseGuards,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { SearchLeadsDto } from '../apollo/dto/search-leads.dto';
import { PaginateLeadsDto } from './dto/paginate-leads.dto';
import { ScheduleCallsDto } from './dto/schedule-calls.dto';
import { CallDataMigrationService } from './call-data-migration.service';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CallDashboardFilterDto {
  @ApiProperty({ required: false, enum: ['all', 'ended', 'error', 'in_progress'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({ required: false, minimum: 1, default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 10;
}

@Controller('leads')
// @UseGuards(AuthGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly callDataMigrationService: CallDataMigrationService
  ) {}

  @Post()
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leads with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated leads' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'industry', required: false, type: String })
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('industry') industry?: string,
  ) {
    return this.leadsService.findAll({ page, limit, status, industry });
  }

  @Get('surplus-machinery')
  @UsePipes(new ValidationPipe({ transform: true }))
  findSurplusMachineryLeads(@Query() paginateDto: PaginateLeadsDto) {
    return this.leadsService.findSurplusMachineryLeads({
      page: paginateDto.page,
      limit: paginateDto.limit,
    });
  }

  @Get('priority')
  @UsePipes(new ValidationPipe({ transform: true }))
  findPriorityLeads(@Query() paginateDto: PaginateLeadsDto) {
    return this.leadsService.findPriorityLeads({
      page: paginateDto.page,
      limit: paginateDto.limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Patch(':id/machinery-info')
  updateMachineryInfo(
    @Param('id') id: string, 
    @Body() machineryInfo: {
      machineryInterest?: string;
      machineryNotes?: string;
      hasSurplusMachinery?: boolean;
      machineryDetails?: {
        types?: string[];
        brands?: string[];
        condition?: string;
        age?: string;
        estimatedValue?: number;
      };
    }
  ) {
    return this.leadsService.update(id, machineryInfo);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }

  @Post('apollo/search')
  @UsePipes(new ValidationPipe({ transform: true }))
  fetchFromApollo(@Body() searchParams: SearchLeadsDto) {
    return this.leadsService.fetchLeadsFromApollo(searchParams);
  }

  @Get('apollo/search-history')
  async getSearchHistory() {
    return this.leadsService.getApolloSearchHistory();
  }

  @Post('generate')
  @UsePipes(new ValidationPipe({ transform: true }))
  generateLeads(@Body() options: {
    type?: string;
    count?: number;
    location?: string;
    industry?: string;
    jobTitle?: string;
  }) {
    // Set default options
    const type = options.type || 'machinery';
    const count = options.count || 25;
    
    // Configure search parameters based on type
    let searchParams: SearchLeadsDto;
    
    switch(type) {
      case 'machinery':
        searchParams = {
          jobTitles: options.jobTitle ? [options.jobTitle] : ['Owner', 'Plant Manager', 'Operations Manager'],
          industries: options.industry ? [options.industry] : ['Manufacturing', 'Industrial Equipment', 'Machinery'],
          locations: options.location ? [options.location] : ['United States'],
          keywords: 'industrial machinery equipment',
          limit: count
        };
        break;
        
      case 'construction':
        searchParams = {
          jobTitles: options.jobTitle ? [options.jobTitle] : ['Owner', 'Project Manager', 'Construction Manager'],
          industries: options.industry ? [options.industry] : ['Construction', 'Building Materials', 'Heavy Equipment'],
          locations: options.location ? [options.location] : ['United States'],
          keywords: 'construction equipment machinery',
          limit: count
        };
        break;
        
      case 'automotive':
        searchParams = {
          jobTitles: options.jobTitle ? [options.jobTitle] : ['Owner', 'Service Manager', 'Operations Director'],
          industries: options.industry ? [options.industry] : ['Automotive', 'Auto Parts', 'Vehicle Manufacturing'],
          locations: options.location ? [options.location] : ['United States'],
          keywords: 'automotive equipment parts machinery',
          limit: count
        };
        break;
        
      default:
        searchParams = {
          jobTitles: options.jobTitle ? [options.jobTitle] : ['Owner', 'CEO', 'President'],
          industries: options.industry ? [options.industry] : ['Manufacturing'],
          locations: options.location ? [options.location] : ['United States'],
          limit: count
        };
    }
    
    return this.leadsService.fetchLeadsFromApollo(searchParams);
  }

  @Post('apollo/machinery-owners')
  @UsePipes(new ValidationPipe({ transform: true }))
  fetchMachineryOwners(@Body() customParams?: Partial<SearchLeadsDto>) {
    // Default parameters optimized for finding machinery owners
    const machineryOwnersParams: SearchLeadsDto = {
      jobTitles: ['Owner', 'CEO', 'President', 'Operations Manager'],
      industries: ['Manufacturing', 'Industrial Equipment', 'Machinery'],
      keywords: 'industrial machinery equipment',
      limit: 25,
      ...customParams, // Allow overriding with custom parameters
    };
    
    return this.leadsService.fetchLeadsFromApollo(machineryOwnersParams);
  }

  @Post('call/schedule')
  @UsePipes(new ValidationPipe({ transform: true }))
  scheduleCallsToLeads(@Body() scheduleDto: ScheduleCallsDto) {
    

    // Otherwise, make the calls immediately
    return this.leadsService.scheduleCallsToLeads(scheduleDto);
  }

  @Post('call/single/:id')
  async callSingleLead(
    @Param('id') id: string,
    @Body() callParams: { toNumber: string, startTime?: string, endTime?: string, override_agent_id?: string }
  ) {
    // Use the dedicated callSingleLead method
    return this.leadsService.callSingleLead(id, callParams);
  }

  @Get(':id/call-history')
  async getLeadCallHistory(@Param('id') id: string) {
    return {
      callHistory: await this.leadsService.getLeadCallHistory(id)
    };
  }

  @Get('calls/list')
  async getCallsList() {
    return this.leadsService.getCallsList();
  }

  @Get('calls/history/:leadId')
  async getCallHistory(@Param('leadId') leadId: string) {
    return this.leadsService.getCallHistory(leadId);
  }

  @Get('calls/:callId')
    async getCallById(@Param('callId') callId: string) {
    const call = await this.leadsService.getCallById(callId);
    if (!call) {
      throw new NotFoundException(`Call with ID ${callId} not found`);
    }
    return call;
  }

  @Post('migrate-call-data')
  async migrateCallData() {
    await this.callDataMigrationService.migrateCallData();
    return { message: 'Call data migration completed successfully' };
  }

  @Get('dashboard/calls')
  @ApiOperation({ summary: 'Get call dashboard data with all leads and their call history' })
  @ApiResponse({ status: 200, description: 'Returns call dashboard data with leads and statistics' })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'ended', 'error', 'in_progress'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1 })
  async getCallDashboard(@Query() filters: CallDashboardFilterDto) {
    return this.leadsService.getCallDashboard(filters);
  }
} 