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
