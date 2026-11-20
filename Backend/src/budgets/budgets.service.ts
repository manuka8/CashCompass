import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { CheckBudgetDto } from './dto/check-budget.dto.js';
import { BudgetPeriod, BudgetType } from '@prisma/client';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    if (!dto.minAmount && !dto.maxAmount) {
      throw new BadRequestException('Please enter at least one limit (Min or Max)');
    }

    if (dto.period === BudgetPeriod.SpecifiedDate && (!dto.startDate || !dto.endDate)) {
      throw new BadRequestException('Please select start and end dates for Specified Date period');
    }

    // Check for existing duplicate budget
    const existing = await this.prisma.budget.findFirst({
      where: {
        userId,
        type: dto.type,
        period: dto.period,
        category: dto.type === BudgetType.Category ? (dto.category ?? null) : null,
        ...(dto.period === BudgetPeriod.SpecifiedDate
          ? { startDate: dto.startDate, endDate: dto.endDate }
          : {}),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A budget with this configuration already exists. Please delete the existing one first.',
      );
    }

    return this.prisma.budget.create({
      data: {
        userId,
        type: dto.type,
        period: dto.period,
        category: dto.type === BudgetType.Category ? (dto.category ?? null) : null,
        minAmount: dto.minAmount ?? null,
        maxAmount: dto.maxAmount ?? null,
        startDate: dto.period === BudgetPeriod.SpecifiedDate ? (dto.startDate ?? null) : null,
        endDate: dto.period === BudgetPeriod.SpecifiedDate ? (dto.endDate ?? null) : null,
        isBlocking: dto.isBlocking ?? false,
      },
    });
  }

  async findAll(userId: string, period?: BudgetPeriod) {
    return this.prisma.budget.findMany({
      where: {
        userId,
        ...(period ? { period } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }

    return this.prisma.budget.delete({
      where: { id },
    });
  }

  async checkLimit(userId: string, dto: CheckBudgetDto) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
    });

    const relevantBudgets = budgets.filter((b) => {
      if (b.type === BudgetType.Expense && (dto.type === 'Expense' || dto.type === 'Transfer')) return true;
      if (b.type === BudgetType.Income && dto.type === 'Income') return true;
      if (b.type === BudgetType.Category && b.category === dto.category) return true;
      return false;
    });

    if (relevantBudgets.length === 0) {
      return { exceeded: false, isBlocked: false, warningMessage: null };
    }

    const now = new Date();

    for (const b of relevantBudgets) {
      let startDateStr = '';
      let endDateStr = '';

      if (b.period === BudgetPeriod.Daily) {
        startDateStr = now.toISOString().split('T')[0];
        endDateStr = startDateStr;
      } else if (b.period === BudgetPeriod.Monthly) {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDateStr = firstDay.toISOString().split('T')[0];
        endDateStr = lastDay.toISOString().split('T')[0];
      } else if (b.period === BudgetPeriod.Yearly) {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        startDateStr = firstDay.toISOString().split('T')[0];
        endDateStr = lastDay.toISOString().split('T')[0];
      } else if (b.period === BudgetPeriod.SpecifiedDate && b.startDate && b.endDate) {
        startDateStr = b.startDate;
        endDateStr = b.endDate;
      }

      // Query existing transactions for period
      const transWhere: any = {
        userId,
        date: {
          gte: startDateStr,
          lte: endDateStr,
        },
      };

      if (b.type === BudgetType.Category && b.category) {
        transWhere.category = b.category;
      } else if (b.type === BudgetType.Expense) {
        transWhere.type = { in: ['Expense', 'Transfer'] };
      } else {
        transWhere.type = b.type;
      }

      const trans = await this.prisma.transaction.findMany({
        where: transWhere,
        select: { amount: true },
      });

      const currentTotal = trans.reduce((sum, t) => sum + t.amount, 0);
      const projectedTotal = currentTotal + dto.amount;

      if (b.maxAmount && projectedTotal > b.maxAmount) {
        const categoryOrType = b.type === BudgetType.Category ? b.category : b.type;
        const warning = `🚨 Limit Exceeded: This will bring your ${b.period} ${categoryOrType} total to ${projectedTotal.toLocaleString()}, which is above your limit of ${b.maxAmount.toLocaleString()}.`;

        return {
          exceeded: true,
          isBlocked: b.isBlocking,
          warningMessage: warning,
          budget: b,
          projectedTotal,
        };
      }
    }

    return { exceeded: false, isBlocked: false, warningMessage: null };
  }
}

