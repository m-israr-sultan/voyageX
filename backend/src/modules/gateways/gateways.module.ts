import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { NotificationsGateway } from './notifications.gateway';

/**
 * Shared home for the WebSocket gateways so they stay true singletons.
 * Extracted from the flat AppModule provider list only so MonitoringModule
 * (Phase O — websocket status probe) can inject the SAME gateway instances
 * instead of Nest creating a second, unbound copy of each gateway.
 */
@Module({
  providers: [MessagesGateway, NotificationsGateway],
  exports: [MessagesGateway, NotificationsGateway],
})
export class GatewaysModule {}
