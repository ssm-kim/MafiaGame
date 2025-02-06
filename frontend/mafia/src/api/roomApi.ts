import api from '@/api/axios';
import { Room, GameStartResponse } from '@/types/room';

interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string;
  result: T;
}

interface CreateRoomRequest {
  roomTitle: string;
  requiredPlayer: number;
  roomPassword?: string;
}

interface RoomIdResponse {
  roomId: number;
}

interface RoomLeaveResponse {
  host: boolean;
}

const roomApi = {
  // 게임방 조회
  getRooms: () => api.get<ApiResponse<Room[]>>('/api/room'),

  // 게임방 생성
  createRoom: (roomData: CreateRoomRequest) =>
    api.post<ApiResponse<RoomIdResponse>>('/api/room', roomData),

  // 게임방 삭제
  deleteRoom: (roomId: number) => api.delete<ApiResponse<[]>>(`/api/room/${roomId}`),

  // 입장
  joinRoom: (roomId: number, password?: string) =>
    api.post<ApiResponse<[]>>(
      `/api/room/${roomId}/enter`,
      password ? { roomPassword: password } : {},
    ),

  // 퇴장
  leaveRoom: (roomId: number) =>
    api.post<ApiResponse<RoomLeaveResponse>>(`/api/room/${roomId}/leave`),

  // 준비상태변경
  readyRoom: (roomId: number) => api.post<ApiResponse<[]>>(`/api/room/${roomId}/ready`),

  // 게임시작
  startGame: (roomId: number) =>
    api.post<ApiResponse<GameStartResponse>>(`/api/room/${roomId}/start`),
};
export default roomApi;
