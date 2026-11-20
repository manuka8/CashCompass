import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetType, BudgetPeriod } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @ApiProperty({ enum: BudgetType, example: BudgetType.Expense })
  @IsEnum(BudgetType)
  type!: BudgetType;

  @ApiProperty({ enum: BudgetPeriod, example: BudgetPeriod.Monthly })
  @IsEnum(BudgetPeriod)
  period!: BudgetPeriod;

  @ApiPropertyOptional({ example: 'Food' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBlocking?: boolean;
}

