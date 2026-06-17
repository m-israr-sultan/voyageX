import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateConversationDto, SendMessageDto } from '../dto/messages.dto';
import { CoreService } from '../services/core.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly core: CoreService) {}

  @Post('conversations')
  createConversation(@CurrentUser() user: { id: string }, @Body() body: CreateConversationDto) {
    return this.core.createConversation(user.id, body.recipientId);
  }

  @Get('conversations')
  conversations(@CurrentUser() user: { id: string }) {
    return this.core.myConversations(user.id);
  }

  @Get('admin/conversations')
  @Roles(UserRole.ADMIN)
  allConversations() {
    return this.core.allConversations();
  }

  @Get('conversations/:id')
  conversation(@CurrentUser() user: { id: string; role: UserRole }, @Param('id') id: string) {
    return this.core.conversationMessages(id, user.id, user.role === UserRole.ADMIN);
  }

  @Post('send')
  send(@CurrentUser() user: { id: string }, @Body() body: SendMessageDto) {
    return this.core.sendMessage(user.id, body);
  }

  @Get('unread')
  async unread(@CurrentUser() user: { id: string }) {
    return { count: await this.core.unreadMessages(user.id) };
  }
}