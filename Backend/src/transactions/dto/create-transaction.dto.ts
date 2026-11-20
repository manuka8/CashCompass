import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ example: 45.5, description: 'Transaction amount' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.Expense })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type!: TransactionType;

  @ApiProperty({ example: 'Food' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
  subCategory!: string;

  @ApiPropertyOptional({ example: 'Weekly supermarket shopping' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2026-11-19', description: 'YYYY-MM-DD date' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: '16:45:00', description: 'HH:mm:ss time' })
  @IsOptional()
  @IsString()
  time?: string;
}

