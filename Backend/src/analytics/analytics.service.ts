import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TransactionType } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeSummary(userId: string, viewType: string = 'Monthly') {
    const now = new Date();
    let startDate = new Date();

    if (viewType === 'Daily') {
      // today
    } else if (viewType === 'Weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (viewType === 'Monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (viewType === 'Yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Transactions for the period
    const periodTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDateStr },
      },
      orderBy: { date: 'desc' },
    });

    let income = 0;
    let expense = 0;
    let transfer = 0;

    for (const t of periodTransactions) {
      if (t.type === TransactionType.Income) income += t.amount;
      else if (t.type === TransactionType.Expense) expense += t.amount;
      else if (t.type === TransactionType.Transfer) transfer += t.amount;
    }

    const balance = income - expense - transfer;

    // Recent 5 transactions
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      take: 5,
    });

    return {
      totals: {
        balance,
        income,
        expense,
        transfer,
      },
      periodTransactions,
      recentTransactions,
    };
  }

  async getChartData(userId: string, period: string = 'Monthly') {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    return {
      transactions,
      count: transactions.length,
    };
  }
}

