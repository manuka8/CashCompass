import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user notifications' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.findAll(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single notification by ID' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications for current user' })
  async removeAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.removeAll(userId);
  }
}

