import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { CheckBudgetDto } from './dto/check-budget.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { BudgetPeriod } from '@prisma/client';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget plan' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user budgets, optionally filtered by period' })
  @ApiQuery({ name: 'period', enum: BudgetPeriod, required: false })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('period') period?: BudgetPeriod,
  ) {
    return this.budgetsService.findAll(userId, period);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if an amount exceeds any active budget limit' })
  async checkLimit(
    @CurrentUser('id') userId: string,
    @Body() dto: CheckBudgetDto,
  ) {
    return this.budgetsService.checkLimit(userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget plan by ID' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.budgetsService.remove(userId, id);
  }
}

