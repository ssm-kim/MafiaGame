// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs'; // 채팅 프로토콜콜
// import { ChatMessage } from '../types/chat';

// let stompClient: Client | null = null; //웹소켓 클라이언트 전역 변수

// 웹소켓 연결 함수
// export const connectWebSocket = (
//   roomId: string, //방 id
//   onMessageReceived: (message: ChatMessage) => void, //메시지 수신시 실행할 콜백
//   onGameStateChanged: (gameState: any) => void // 게임 상태 변경시 실행할 콜백
// ) => {

// 이미 연결 되어 있으면 연결 해제
//   if (stompClient) {
//     stompClient.deactivate();
//   }

// 새로운 stomp 클라이언트 생성
//   stompClient = new Client({
// 웹소켓 서버 연결
//     webSocketFactory: () => new SockJS('url'),
// 연결 성공하면 콜백
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

// 연결 시작
//   stompClient.activate();
//   return stompClient;
// };

// 채팅 메시지 전송하는 함수
// export const sendChatMessage = (roomId: string, content: string) => {
//   if (stompClient && stompClient.connected) {
//     stompClient.publish({
//       destination: `/app/room/${roomId}/chat`, //메시지 보낼 주소
//       body: JSON.stringify({ content }) //메시지 내용
//     });
//   }
// };

import { ChatMessage } from '@/types/chat';

export const connectWebSocket = (
  roomId: string,
  onMessageReceived: (message: ChatMessage) => void,
  onGameStateChanged: (gameState: any) => void,
) => {
  // 임시로 5초마다 메시지 보내기
  const interval = setInterval(() => {
    onMessageReceived({
      id: Date.now().toString(),
      senderName: '시스템',
      content: '테스트 메시지입니다.',
      timestamp: new Date().toISOString(),
    });
  }, 70000);

  return {
    deactivate: () => clearInterval(interval),
  };
};

export const sendChatMessage = (roomId: string, message: string) => {
  console.log(`Message sent to room ${roomId}: ${message}`);
};
