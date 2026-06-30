import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { resolveCorsOrigin } from '../../config/cors.config';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: resolveCorsOrigin(), credentials: true } })
export class NotificationsGateway {
  @WebSocketServer() server!: Server;

  emitToUser(userId: string, payload: unknown): void {
    this.server.to(userId).emit('notification', payload);
  }
}
