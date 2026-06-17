import { Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { CoreService } from '../services/core.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly core: CoreService) {}
  @Get() all(@CurrentUser() user: AuthUser) { return this.core.notifications(user.id); }
  @Get('unread-count') async unread(@CurrentUser() user: AuthUser) { return { count: await this.core.unreadNotifications(user.id) }; }
  @Patch(':id/read') read(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.core.readNotification(id, user.id); }
  @Patch('read-all') readAll(@CurrentUser() user: AuthUser) { return this.core.readAllNotifications(user.id); }
  @Delete() clear(@CurrentUser() user: AuthUser) { return this.core.clearNotifications(user.id); }
}
