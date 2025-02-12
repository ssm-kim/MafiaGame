import { Stomp } from '@stomp/stompjs';
import { ChatMessage } from '@/types/chat';
import { Room } from '@/types/room';

// 채팅 타입 정의
type ChatType = 'ROOM' | 'DAY' | 'NIGHT' | 'DEAD' | 'SYSTEM';

// 스톰프 클라이언트 전역 변수
let stompClient: any = null;

// 채팅 구독 함수
export const subscribeToChat = (
  chatType: ChatType,
  roomId: string,
  onMessageReceived: (message: ChatMessage) => void,
) => {
  if (!stompClient) {
    console.error('STOMP client not initialized');
    return;
  }

  const topicMap = {
    ROOM: `/topic/room-${roomId}-chat`,
    DAY: `/topic/game-${roomId}-day-chat`,
    NIGHT: `/topic/game-${roomId}-night-chat`,
    DEAD: `/topic/game-${roomId}-dead-chat`,
    SYSTEM: `/topic/game-${roomId}-system`,
  };

  const topic = topicMap[chatType];

  stompClient.subscribe(topic, (message: any) => {
    try {
      const parsedMessage = JSON.parse(message.body);

      // 채팅 메시지 생성 시 타입 정보 포함
      const chatMessage: ChatMessage = {
        id: parsedMessage.messageId || Date.now().toString(),
        senderName: chatType === 'SYSTEM' ? 'SYSTEM' : parsedMessage.sender,
        content: parsedMessage.content,
        timestamp: parsedMessage.timestamp || new Date().toISOString(),
        type: chatType, // 채팅 타입 추가
      };

      onMessageReceived(chatMessage);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
};

// 웹소켓 연결 함수
export const connectWebSocket = (
  onMessageReceived: (message: ChatMessage) => void,
  roomId: string,
) => {
  try {
    // 웹소켓 연결
    const socket = new WebSocket('wss://i12d101.p.ssafy.io/ws-mafia');
    // const socket = new WebSocket('ws://localhost:8080/ws-mafia');
    stompClient = Stomp.over(socket);

    const onConnect = () => {
      console.log('WebSocket Connected');

      // 기본 방 채팅 구독
      subscribeToChat('ROOM', roomId, onMessageReceived);
    };

    const onError = (error: any) => {
      console.error('STOMP connection error:', error);
    };

    stompClient.connect({}, onConnect, onError);

    return stompClient;
  } catch (error) {
    console.error('WebSocket connection error:', error);
    throw error;
  }
};

// 채팅 메시지 전송 함수
export const sendChatMessage = (
  content: string,
  roomId: string,
  chatType: Exclude<ChatType, 'SYSTEM'>, // SYSTEM 타입 제외
) => {
  if (!stompClient || !stompClient.connected) {
    console.error('STOMP client not connected');
    return;
  }

  try {
    stompClient.send(
      '/app/chat/send',
      {},
      JSON.stringify({
        gameId: roomId,
        content,
        chatType,
      }),
    );
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// 웹소켓 연결 해제
export const disconnectWebSocket = () => {
  if (stompClient) {
    try {
      stompClient.disconnect();
      stompClient = null;
      console.log('WebSocket Disconnected');
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
  }
};

// 구독 상태 체크
export const isSubscribed = (chatType: ChatType, roomId: string): boolean => {
  if (!stompClient) return false;

  const topic = `/topic/${chatType === 'ROOM' ? 'room' : 'game'}-${roomId}-${chatType.toLowerCase()}-chat`;
  return Object.prototype.hasOwnProperty.call(stompClient.subscriptions, topic);
};

// 게임 상태에 따른 채팅 타입 반환
export const getChatTypeByGameState = (gameState: Room | null, playerId: number): ChatType => {
  if (!gameState || !gameState.roomStatus) {
    return 'ROOM';
  }

  const participant = gameState.participant[playerId];
  if (!participant) {
    return 'ROOM';
  }

  if (participant.isDead) {
    return 'DEAD';
  }

  // isNight가 없는 경우 기본값으로 'DAY' 반환
  return gameState.isNight ? 'NIGHT' : 'DAY';
};

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

// import { Client } from '@stomp/stompjs';
// import { ChatMessage } from '@/types/chat';

// export const connectWebSocket = (
//   roomId: string,
//   onMessageReceived: (message: ChatMessage) => void,
//   onGameStateChanged: (gameState: any) => void,
// ) => {
//   const client = new Client({
//     brokerURL: 'ws://localhost:8080/mafia',
//     debug: (str) => console.log(`STOMP: ${str}`),
//     reconnectDelay: 5000,
//   });

//   client.onConnect = () => {
//     client.subscribe(`/topic/room/${roomId}/chat`, (message) => {
//       const chatMessage = JSON.parse(message.body);
//       onMessageReceived(chatMessage);
//     });

//     client.subscribe(`/topic/room/${roomId}/state`, (message) => {
//       const gameState = JSON.parse(message.body);
//       onGameStateChanged(gameState);
//     });
//   };

//   client.activate();
//   return client;
// };

// export const sendChatMessage = (roomId: string, message: string) => {
//   const client = new Client({
//     brokerURL: 'ws://localhost:8080/mafia',
//   });

//   client.onConnect = () => {
//     client.publish({
//       destination: `/app/room/${roomId}/chat`,
//       body: JSON.stringify({
//         content: message,
//         timestamp: new Date().toISOString(),
//       }),
//     });
//     client.deactivate();
//   };

//   client.activate();
// };

// export default connectWebSocket;

// import { Stomp } from '@stomp/stompjs';
// import { ChatMessage } from '@/types/chat';

// let stompClient: any = null;

// export const connectWebSocket = (
//   onMessageReceived: (message: ChatMessage) => void,
//   roomId: string,
// ) => {
//   // 웹소켓 연결
//   const socket = new WebSocket('ws://{배포 주소}/ws-mafia');
//   stompClient = Stomp.over(socket);

//   stompClient.connect({}, () => {
//     // 방 채팅 구독
//     stompClient.subscribe(`/topic/room-${roomId}-chat`, (message: any) => {
//       const chatMessage = JSON.parse(message.body);
//       onMessageReceived({
//         id: Date.now().toString(),
//         senderName: chatMessage.sender,
//         content: chatMessage.content,
//         timestamp: new Date().toISOString(),
//       });
//     });

//     // 시스템 메시지 구독
//     stompClient.subscribe(`/topic/game-${roomId}-system`, (message: any) => {
//       const systemMessage = JSON.parse(message.body);
//       onMessageReceived({
//         id: Date.now().toString(),
//         senderName: 'SYSTEM',
//         content: systemMessage.content,
//         timestamp: new Date().toISOString(),
//       });
//     });
//   });

//   return {
//     subscribe: (chatType: string) => {
//       // 게임 중 추가 채팅방 구독 (낮/밤/사망자)
//       stompClient.subscribe(`/topic/game-${roomId}-${chatType}-chat`, (message: any) => {
//         const chatMessage = JSON.parse(message.body);
//         onMessageReceived({
//           id: Date.now().toString(),
//           senderName: chatMessage.sender,
//           content: chatMessage.content,
//           timestamp: new Date().toISOString(),
//         });
//       });
//     },
//     deactivate: () => {
//       if (stompClient) {
//         stompClient.disconnect();
//       }
//     },
//   };
// };

// export const sendChatMessage = (message: string, roomId: string, chatType: string = 'ROOM') => {
//   if (stompClient && stompClient.connected) {
//     stompClient.send(
//       '/app/chat/send',
//       {},
//       JSON.stringify({
//         gameId: roomId,
//         content: message,
//         chatType,
//       }),
//     );
//   }
// };
