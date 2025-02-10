// import { Stomp } from '@stomp/stompjs';
// import api from '@/api/axios';
// import { Room, GameStartResponse } from '@/types/room';

// interface ApiResponse<T> {
//   isSuccess: boolean;
//   code: number;
//   message: string;
//   result: T;
// }

// // interface CreateRoomRequest {
// //   roomTitle: string;
// //   requiredPlayer: number;
// //   roomPassword?: string;
// // }
// interface CreateRoomRequest {
//   title: string;
//   requiredPlayers: number;
//   password?: string;
//   gameOption: {};
// }

// interface RoomIdResponse {
//   roomId: number;
// }

// interface RoomLeaveResponse {
//   host: boolean;
// }

// // const roomApi = {
// //   // 게임방 조회
// //   getRooms: () => api.get<ApiResponse<Room[]>>('/api/room'),
// //   getRoom: (roomId: number) => api.get<ApiResponse<Room>>(`/api/room/${roomId}`),
// //   // 게임방 생성
// //   createRoom: (roomData: CreateRoomRequest) => {
// //     console.log(roomData);
// //     return api.post<ApiResponse<RoomIdResponse>>('/api/room', roomData);
// //   },

// //   // 게임방 삭제
// //   deleteRoom: (roomId: number) => api.delete<ApiResponse<[]>>(`/api/room/${roomId}`),

// //   // 입장
// //   joinRoom: (roomId: number, password?: string) =>
// //     api.post<ApiResponse<[]>>(
// //       `/api/room/${roomId}/enter`,
// //       password ? { roomPassword: password } : {},
// //     ),

// //   // 퇴장
// //   leaveRoom: (roomId: number) =>
// //     api.post<ApiResponse<RoomLeaveResponse>>(`/api/room/${roomId}/leave`),

// //   // 준비상태변경
// //   readyRoom: (roomId: number) => api.post<ApiResponse<[]>>(`/api/room/${roomId}/ready`),

// //   // 게임시작
// //   startGame: (roomId: number) =>
// //     api.post<ApiResponse<GameStartResponse>>(`/api/room/${roomId}/start`),
// // };
// // export default roomApi;
// let stompClient: any = null;

// const initializeWebSocket = () => {
//   const socket = new WebSocket('wss://i12d101.p.ssafy.io/ws-mafia');
//   stompClient = Stomp.over(socket);
//   return new Promise((resolve, reject) => {
//     stompClient.connect({}, () => resolve(stompClient), reject);
//   });
// };

// const roomApi = {
//   // HTTP 요청으로 유지할 것들
//   getRooms: () => api.get<ApiResponse<Room[]>>('/api/room'),
//   getRoom: (roomId: number) => api.get<ApiResponse<Room>>(`/api/room/${roomId}`),
//   createRoom: (roomData: CreateRoomRequest) => {
//     console.log(roomData);
//     return api.post<ApiResponse<RoomIdResponse>>('/api/room', roomData);
//   },

//   // WebSocket으로 변경할 것들
//   joinRoom: async (roomId: number, password?: string) => {
//     if (!stompClient) {
//       await initializeWebSocket();
//     }

//     return new Promise((resolve, reject) => {
//       try {
//         stompClient.send(
//           `/app/room/enter/${roomId}`,
//           {},
//           JSON.stringify({
//             memberId: Number(localStorage.getItem('memberId')),
//             password: password || null,
//           }),
//         );
//         resolve({ data: { isSuccess: true, result: [] } });
//       } catch (error) {
//         reject(error);
//       }
//     });
//   },

//   leaveRoom: async (roomId: number) => {
//     if (!stompClient) {
//       await initializeWebSocket();
//     }

//     return new Promise((resolve, reject) => {
//       try {
//         stompClient.send(
//           `/app/room/leave/${roomId}`,
//           {},
//           JSON.stringify({
//             memberId: Number(localStorage.getItem('memberId')),
//           }),
//         );
//         resolve({ data: { isSuccess: true, result: { host: false } } });
//       } catch (error) {
//         reject(error);
//       }
//     });
//   },

//   readyRoom: async (roomId: number) => {
//     if (!stompClient) {
//       await initializeWebSocket();
//     }

//     return new Promise((resolve, reject) => {
//       try {
//         stompClient.send(
//           `/app/room/ready/${roomId}`,
//           {},
//           JSON.stringify({
//             memberId: Number(localStorage.getItem('memberId')),
//           }),
//         );
//         resolve({ data: { isSuccess: true, result: [] } });
//       } catch (error) {
//         reject(error);
//       }
//     });
//   },

//   startGame: async (roomId: number) => {
//     if (!stompClient) {
//       await initializeWebSocket();
//     }

//     return new Promise((resolve, reject) => {
//       try {
//         stompClient.send(
//           `/app/room/start/${roomId}`,
//           {},
//           JSON.stringify({
//             memberId: Number(localStorage.getItem('memberId')),
//           }),
//         );
//         resolve({ data: { isSuccess: true, result: {} as GameStartResponse } });
//       } catch (error) {
//         reject(error);
//       }
//     });
//   },

//   // WebSocket 연결 관리
//   disconnect: () => {
//     if (stompClient) {
//       stompClient.disconnect();
//       stompClient = null;
//     }
//   },
// };

// export default roomApi;

import { Stomp } from '@stomp/stompjs';
// import { AxiosResponse } from 'axios';
import api from '@/api/axios';
import { Room, GameStartResponse } from '@/types/room';

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

interface WebSocketResponse {
  data: {
    isSuccess: boolean;
    result: any;
  };
}

let stompClient: any = null;

const roomApi = {
  getRooms: () => api.get<ApiResponse<Room[]>>('/api/room'),
  getRoom: (roomId: number) => api.get<ApiResponse<Room>>(`/api/room/${roomId}`),
  createRoom: (roomData: CreateRoomRequest) => {
    console.log(roomData);
    return api.post<ApiResponse<RoomIdResponse>>('/api/room', roomData);
  },
  deleteRoom: (roomId: number) => api.delete<ApiResponse<void>>(`/api/room/${roomId}`),

  initializeWebSocket: async () => {
    const socket = new WebSocket('wss://i12d101.p.ssafy.io/ws-mafia');
    stompClient = Stomp.over(socket);
    return new Promise<any>((resolve, reject) => {
      stompClient.connect({}, () => resolve(stompClient), reject);
    });
  },

  subscribeLobby: (onRoomsUpdate: (rooms: Room[]) => void) => {
    if (!stompClient) return;
    return stompClient.subscribe('/topic/lobby', (message: any) => {
      try {
        const rooms = JSON.parse(message.body);
        onRoomsUpdate(rooms);
      } catch (error) {
        console.error('Error processing room list:', error);
      }
    });
  },

  subscribeRoom: (roomId: number, onRoomUpdate: (roomInfo: Room) => void) => {
    if (!stompClient) return;
    return stompClient.subscribe(`/topic/room/${roomId}`, (message: any) => {
      try {
        const roomInfo = JSON.parse(message.body);
        onRoomUpdate(roomInfo);
      } catch (error) {
        console.error('Error processing room info:', error);
      }
    });
  },

  joinRoom: async (roomId: number, password?: string): Promise<WebSocketResponse> => {
    if (!stompClient) {
      await roomApi.initializeWebSocket();
    }

    return new Promise((resolve, reject) => {
      try {
        stompClient.send(
          `/app/room/enter/${roomId}`,
          {},
          JSON.stringify({
            memberId: Number(localStorage.getItem('memberId')),
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

    return new Promise((resolve, reject) => {
      try {
        stompClient.send(
          `/app/room/leave/${roomId}`,
          {},
          JSON.stringify({
            memberId: Number(localStorage.getItem('memberId')),
          }),
        );
        resolve({ data: { isSuccess: true, result: { host: false } } });
      } catch (error) {
        reject(error);
      }
    });
  },

  readyRoom: async (roomId: number): Promise<WebSocketResponse> => {
    if (!stompClient) {
      await roomApi.initializeWebSocket();
    }

    return new Promise((resolve, reject) => {
      try {
        stompClient.send(
          `/app/room/ready/${roomId}`,
          {},
          JSON.stringify({
            memberId: Number(localStorage.getItem('memberId')),
          }),
        );
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
        stompClient.send(
          `/app/room/start/${roomId}`,
          {},
          JSON.stringify({
            memberId: Number(localStorage.getItem('memberId')),
          }),
        );
        resolve({ data: { isSuccess: true, result: {} as GameStartResponse } });
      } catch (error) {
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
