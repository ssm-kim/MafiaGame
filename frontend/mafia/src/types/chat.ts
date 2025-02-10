// export interface ChatMessage {
//     id: string;
//     senderId: string;
//     senderName: string;
//     content: string;
//     timestamp: string;
//     roomId: string;
//   }

export interface ChatMessage {
  id: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM';
}
