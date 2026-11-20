import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('home')
  @ApiOperation({ summary: 'Get home dashboard statistics, totals and recent transactions' })
  @ApiQuery({ name: 'viewType', required: false, enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'] })
  async getHomeSummary(
    @CurrentUser('id') userId: string,
    @Query('viewType') viewType?: string,
  ) {
    return this.analyticsService.getHomeSummary(userId, viewType);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get transactions data formatted for charts' })
  @ApiQuery({ name: 'period', required: false, enum: ['Daily', 'Monthly', 'Yearly'] })
  async getChartData(
    @CurrentUser('id') userId: string,
    @Query('period') period?: string,
  ) {
    return this.analyticsService.getChartData(userId, period);
  }
}

