import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsUUID() @IsNotEmpty() recipientId!: string;
}

export class SendMessageDto {
  @IsUUID() @IsNotEmpty() conversationId!: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) content!: string;
}
