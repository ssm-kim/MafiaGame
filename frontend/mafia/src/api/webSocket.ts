// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';
// import { ChatMessage } from '../types/chat';

// let stompClient: Client | null = null;

// export const connectWebSocket = (
//   roomId: string,
//   onMessageReceived: (message: ChatMessage) => void,
//   onGameStateChanged: (gameState: any) => void
// ) => {
//   if (stompClient) {
//     stompClient.deactivate();
//   }

//   stompClient = new Client({
//     webSocketFactory: () => new SockJS('http://your-backend-url/ws'),
//     onConnect: () => {
//       // 채팅 메시지 구독
//       stompClient?.subscribe(`/topic/room/${roomId}/chat`, (message) => {
//         const chatMessage = JSON.parse(message.body);
//         onMessageReceived(chatMessage);
//       });

//       // 게임 상태 변경 구독
//       stompClient?.subscribe(`/topic/room/${roomId}/game`, (message) => {
//         const gameState = JSON.parse(message.body);
//         onGameStateChanged(gameState);
//       });
//     },
//   });

//   stompClient.activate();
//   return stompClient;
// };

// export const sendChatMessage = (roomId: string, content: string) => {
//   if (stompClient && stompClient.connected) {
//     stompClient.publish({
//       destination: `/app/room/${roomId}/chat`,
//       body: JSON.stringify({ content })
//     });
//   }
// };


import { ChatMessage } from '../types/chat';

export const connectWebSocket = (
  roomId: string,
  onMessageReceived: (message: ChatMessage) => void,
  onGameStateChanged: (gameState: any) => void
) => {
  // 임시로 5초마다 메시지 보내기
  const interval = setInterval(() => {
    onMessageReceived({
      id: Date.now().toString(),
      senderName: '시스템',
      content: '테스트 메시지입니다.',
      timestamp: new Date().toISOString()
    });
  }, 5000);

  return {
    deactivate: () => clearInterval(interval)
  };
};

export const sendChatMessage = (roomId: string, message: string) => {
  console.log(`Message sent to room ${roomId}: ${message}`);
};