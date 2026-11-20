import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Budget Limit Warning' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'You have reached 90% of your Food budget.' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: 'Budget Warning' })
  @IsOptional()
  @IsString()
  type?: string;
}

