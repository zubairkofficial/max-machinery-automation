import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
// import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-activity')
  async getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('upcoming-calls')
  async getUpcomingCalls() {
    return this.dashboardService.getUpcomingCalls();
  }
} 