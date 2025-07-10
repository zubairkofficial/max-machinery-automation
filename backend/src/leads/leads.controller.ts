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
  ParseIntPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { SearchLeadsDto } from '../apollo/dto/search-leads.dto';
import { PaginateLeadsDto } from './dto/paginate-leads.dto';
import { ScheduleCallsDto } from './dto/schedule-calls.dto';
import { CallDataMigrationService } from './call-data-migration.service';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { CallDashboardFilterDto } from './dto/call-filter.dto';



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
    @Query('linkClicked') linkClicked?: string,
    @Query('formSubmitted') formSubmitted?: string,
    @Query('reschedule') reschedule?: string,
  ) {
    return this.leadsService.findAll({ page, limit, status, industry, linkClicked, formSubmitted, reschedule });
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

  @Get(':id/call-history')
  async getLeadCallHistory(@Param('id') id: string) {
    return {
      callHistory: await this.leadsService.getLeadCallHistory(id)
    };
  }

  @Post('call/single/:id')
  async callSingleLead(
    @Param('id') id: string,
    @Body() callParams: { toNumber: string,  override_agent_id?: string }
  ) {
    // Use the dedicated callSingleLead method
    return this.leadsService.callSingleLead(id, callParams);
  }

  @Get('call-history')
  @ApiOperation({ summary: 'Get all call history with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated call history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAllCallHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.leadsService.getAllCallHistory({ page, limit, status, startDate, endDate });
  }

  @Get('get/all-history')
  @ApiOperation({ summary: 'Get all call history in descending order with pagination' })
  @ApiResponse({ status: 200, description: 'Returns call history sorted by newest first' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by call status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Search by lead name (firstName or lastName)' })
  @ApiQuery({ name: 'reschedule', required: false, type: String, description: 'Filter by reschedule status (scheduled/not_scheduled)' })
  @ApiQuery({ name: 'linkClicked', required: false, type: String, description: 'Filter by link click status (clicked/not_clicked)' })
  @ApiQuery({ name: 'formSubmitted', required: false, type: String, description: 'Filter by form submission status (submitted/not_submitted)' })
  async getAllCallHistoryDescending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('name') name?: string,
    @Query('reschedule') reschedule?: string,
    @Query('linkClicked') linkClicked?: string,
    @Query('formSubmitted') formSubmitted?: string,
  ) {
    try {
      const result = await this.leadsService.getAllCallHistoryDescending({ 
        page, 
        limit, 
        status, 
        startDate, 
        endDate,
        name,
        reschedule,
        linkClicked,
        formSubmitted
      });
      
      return {
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch call history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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