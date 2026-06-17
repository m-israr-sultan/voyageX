import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: true } })
export class NotificationsGateway {
  @WebSocketServer() server!: Server;

  emitToUser(userId: string, payload: unknown): void {
    this.server.to(userId).emit('notification', payload);
  }
}
