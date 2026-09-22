export type ChatMessageType = 'user' | 'system' | 'action' | 'phase' | 'elimination';

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName?: string;
  senderGender?: 'male' | 'female';
  text: string;
  timestamp: number;
  type: ChatMessageType;
  icon?: string;
}
