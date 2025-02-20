import { Stomp } from '@stomp/stompjs';
import api from '@/api/axios';
import { Room, GameStartResponse, ParticipantMap, GameStart } from '@/types/room';

interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string;
  result: T;
}

interface CreateRoomRequest {
  title: string;
  requiredPlayers: number;
  password?: string;
  gameOption: {
    zombie: number;
    mutant: number;
    doctorSkillUsage: number;
    nightTimeSec: number;
    dayDisTimeSec: number;
  };
}

interface RoomIdResponse {
  roomId: number;
}

interface RoomEnterResponse {
  myParticipantNo: number;
}

interface WebSocketResponse {
  data: {
    isSuccess: boolean;
    result: any;
  };
}

let stompClient: any = null;

const roomApi = {
  // HTTP 요청
  getRooms: () => api.get<ApiResponse<Room[]>>('/api/room'),
  getRoom: (roomId: number) => api.get<ApiResponse<Room>>(`/api/room/${roomId}`),
  getRoomParticipantNo: (roomId: number) =>
    api.get<ApiResponse<RoomEnterResponse>>(`/api/room/${roomId}/enter`),

  // WebSocket 초기화
  initializeWebSocket: async () => {
    try {
      // const socket = new WebSocket('wss://i12d101.p.ssafy.io/ws-mafia');
      const socket = new WebSocket('ws://localhost:8080/ws-mafia');
      stompClient = Stomp.over(socket);
      stompClient.reconnect_delay = 5000;

      stompClient.debug = () => {};

      return await new Promise<any>((resolve, reject) => {
        const connectCallback = () => resolve(stompClient);
        const errorCallback = (error: any) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        };

        stompClient.connect({}, connectCallback, errorCallback);
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  },

  // 방 생성
  createRoom: async (roomData: CreateRoomRequest) => {
    //console.log('요청 데이터:', JSON.stringify(roomData, null, 2));
    const response = await api.post<ApiResponse<RoomIdResponse>>('/api/room', roomData);
    return response;
  },

  subscribeLobby: (onRoomsUpdate: (rooms: Room[]) => void) => {
    if (!stompClient) return;
    return stompClient.subscribe('/topic/lobby', (message: any) => {
      try {
        const rooms = JSON.parse(message.body);
        //console.log('방 목록 웹소켓 데이터:', JSON.stringify(rooms, null, 2));
        onRoomsUpdate(rooms);
      } catch (error) {
        console.error('Error processing room list:', error);
      }
    });
  },

  subscribeRoom: (roomId: number, onRoomUpdate: (roomInfo: ParticipantMap | GameStart) => void) => {
    //console.log('방 구독');
    if (!stompClient) return;
    const stompClientSubscription = stompClient.subscribe(
      `/topic/room/${roomId}`,
      (message: any) => {
        try {
          const roomInfo = JSON.parse(message.body);

          // 강퇴 메시지인 경우
          if ('message' in roomInfo) {
            //console.log('메시지 확인:', roomInfo.message);
            if (roomInfo.message && typeof roomInfo.message === 'string') {
              if (roomInfo.message.includes('강제퇴장') || roomInfo.message.includes('강퇴')) {
                alert('강퇴되었습니다.');
                onRoomUpdate({ ...roomInfo, isKicked: true });
                return;
              }
            }
          }

          onRoomUpdate(roomInfo);
        } catch (error) {
          console.error('Error processing room info:', error);
        }
      },
    );

    return stompClientSubscription;
  },

  joinRoom: async (roomId: number, password?: string): Promise<WebSocketResponse> => {
    if (!stompClient) {
      await roomApi.initializeWebSocket();
    }

    //console.log('방 입장 시도:', { roomId, password });

    return new Promise((resolve, reject) => {
      try {
        stompClient.send(
          `/app/room/enter/${roomId}`,
          {},
          JSON.stringify({
            password: password || null,
          }),
        );
        resolve({ data: { isSuccess: true, result: [] } });
      } catch (error) {
        reject(error);
      }
    });
  },

  leaveRoom: async (roomId: number): Promise<WebSocketResponse> => {
    if (!stompClient) {
      await roomApi.initializeWebSocket();
    }

    try {
      stompClient.send(`/app/room/leave/${roomId}`, {}, JSON.stringify({}));
      return { data: { isSuccess: true, result: {} } };
    } catch (error) {
      console.error('방 나가기/삭제 실패:', error);
      throw error;
    }
  },

  readyRoom: async (roomId: number): Promise<WebSocketResponse> => {
    if (!stompClient) {
      await roomApi.initializeWebSocket();
    }

    return new Promise((resolve, reject) => {
      try {
        stompClient.send(`/app/room/ready/${roomId}`, {}, JSON.stringify({}));
        resolve({ data: { isSuccess: true, result: [] } });
      } catch (error) {
        reject(error);
      }
    });
  },

  startGame: async (roomId: number): Promise<WebSocketResponse> => {
    if (!stompClient) {
      await roomApi.initializeWebSocket();
    }

    return new Promise((resolve, reject) => {
      try {
        stompClient.send(`/app/room/start/${roomId}`);
        resolve({ data: { isSuccess: true, result: {} as GameStartResponse } });
      } catch (error) {
        reject(error);
      }
    });
  },

  kickMember: async (roomId: number, targetParticipantNo: number): Promise<WebSocketResponse> => {
    if (!stompClient) {
      await roomApi.initializeWebSocket();
    }

    if (!roomId) {
      console.error('방 ID가 없습니다.');
      throw new Error('방 ID가 필요합니다.');
    }

    // console.log('강퇴 요청 파라미터:', {
    //   roomId,
    //   targetParticipantNo,
    //   destination: `/app/room/kick/${roomId}`,
    //   message: { targetParticipantNo },
    // });

    return new Promise((resolve, reject) => {
      try {
        stompClient.send(
          `/app/room/kick/${roomId}`,
          {},
          JSON.stringify({
            targetParticipantNo: Number(targetParticipantNo),
          }),
        );
        resolve({ data: { isSuccess: true, result: [] } });
      } catch (error) {
        console.error('강퇴 요청 실패:', error);
        reject(error);
      }
    });
  },

  disconnect: () => {
    if (stompClient) {
      stompClient.disconnect();
      stompClient = null;
    }
  },

  getStompClient: () => stompClient,
};

export default roomApi;