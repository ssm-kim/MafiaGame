import api from '@/api/axios';
import { Room, GameStartResponse } from '@/types/room';

interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string;
  result: T;
}

interface RoomRequest {
  roomTitle: string;
  roomPassword?: string;
  requiredPlayer: number;
}

interface RoomIdResponse {
  roomId: number;
}

interface RoomLeaveResponse {
  host: boolean;
}

const TestRoomApi = {
  getRooms: () => api.get<ApiResponse<Room[]>>('/api/room/test'),
  getRoom: (roomId:number) => api.get<ApiResponse<Room>>(`api/room/test/${roomId}`),

  // createRoom: (data: CreateRoomRequest) =>
  //   api.post<ApiResponse<RoomIdResponse>>('/api/room/test', data, {
  //     params: { memberId: Number(localStorage.getItem('memberId')) },
  //   }),
  createRoom: (data: RoomRequest) => {
    const memberId = Number(localStorage.getItem('memberId'));
    console.log('createRoom 호출 - memberId:', memberId);
    console.log(data);
    return api.post<ApiResponse<RoomIdResponse>>('/api/room/test', data, {
      // RoomIdResponse[] 가 아닌 RoomIdResponse로 변경
      params: { memberId },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  joinRoom: (roomId: number, memberId: number) => {
    const data = { roomPassword: '' };
    console.log('Enter Room Request:', { roomId, memberId, data });
    return api.post<ApiResponse<void>>(`/api/room/test/${roomId}/enter`, data, {
      params: { memberId },
    });
  },

  leaveRoom: (roomId: number, memberId: number) =>
    api.post<ApiResponse<RoomLeaveResponse>>(`/api/room/test/${roomId}/leave`, null, {
      params: { memberId },
    }),

  readyRoom: (roomId: number, memberId: number) =>
    api.post<ApiResponse<void>>(`/api/room/test/${roomId}/ready`, null, {
      params: { memberId },
    }),

  startGame: (roomId: number, memberId: number) =>
    api.post<ApiResponse<GameStartResponse>>(`/api/room/test/${roomId}/start`, null, {
      params: { memberId },
    }),

  login: (username: string, password: string) =>
    api.post<ApiResponse<{ memberId: number; nickname: string }>>('/api/auth/test/login', {
      username,
      password,
    }),
  logout: () => {
    localStorage.removeItem('memberId');
    localStorage.removeItem('nickname');
  },
};

export default TestRoomApi;
