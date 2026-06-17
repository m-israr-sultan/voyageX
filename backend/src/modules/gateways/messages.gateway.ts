import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/messages', cors: { origin: true } })
export class MessagesGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage('join')
  join(@ConnectedSocket() socket: Socket, @MessageBody() body: { conversationId: string }) {
    socket.join(body.conversationId);
    return { joined: body.conversationId };
  }

  @SubscribeMessage('typing')
  typing(@MessageBody() body: { conversationId: string; userId: string }) {
    this.server.to(body.conversationId).emit('typing', body);
  }
}
