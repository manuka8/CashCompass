import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { FilterTransactionsDto } from './dto/filter-transactions.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const now = new Date();
    const date = dto.date || now.toISOString().split('T')[0];
    const time = dto.time || now.toTimeString().split(' ')[0];

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        subCategory: dto.subCategory,
        note: dto.note ?? null,
        date,
        time,
      },
    });

    return transaction;
  }

  async findAll(userId: string, filters: FilterTransactionsDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subCategory) {
      where.subCategory = filters.subCategory;
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      take: filters.limit ?? 100,
    });

    return transactions;
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOne(userId, id);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.subCategory !== undefined && { subCategory: dto.subCategory }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.date !== undefined && { date: dto.date }),
        ...(dto.time !== undefined && { time: dto.time }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}

