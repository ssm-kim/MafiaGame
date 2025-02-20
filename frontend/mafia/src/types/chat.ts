export interface ChatMessage {
  id: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM';
}
