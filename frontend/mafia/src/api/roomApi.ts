import api from '@/api/axios';
import { Room } from '@/types/room';

interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string;
  result: T;
}

interface CreateRoomRequest {
  roomTitle: string;
  maxPlayers: number;
  roomOption: string;
  isVoice: boolean;
}

const roomApi = {
  // 게임방 조회
  getRooms: () => api.get<ApiResponse<Room[]>>('/api/room'),

  // 게임방 생성
  createRoom: (roomData: CreateRoomRequest) => api.post<ApiResponse<Room>>('/api/room', roomData),

  // 특정 게임방 조회
  getRoom: (roomId: string) => api.get<ApiResponse<Room>>(`/api/room/${roomId}`),

  // 게임방 삭제
  deleteRoom: (roomId: string) => api.delete<ApiResponse<null>>(`/api/room/${roomId}`),

  // 입장
  joinRoom: (roomId: string) => api.post<ApiResponse<null>>(`/api/room/${roomId}/enter`),

  // 퇴장
  leaveRoom: (roomId: string) => api.post<ApiResponse<null>>(`/api/room/${roomId}/leave`),

  // 준비상태변경 (새로 추가)
  readyRoom: (roomId: string) => api.post<ApiResponse<null>>(`/api/room/${roomId}/ready`),

  // 게임시작 (새로 추가)
  startGame: (roomId: string) => api.post<ApiResponse<null>>(`/api/room/${roomId}/start`),
};

export default roomApi;
