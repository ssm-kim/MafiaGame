// import api from './axios';
// import { Room } from '../types/room';

// export const roomApi = {
//   getRooms: () => api.get<Room[]>('/rooms'),
//   createRoom: (room: Partial<Room>) => api.post<Room>('/rooms', room),
//   getRoom: (roomId: string) => api.get<Room>(`/rooms/${roomId}`),
//   joinRoom: (roomId: string) => api.post(`/rooms/${roomId}/join`),
//   leaveRoom: (roomId: string) => api.post(`/rooms/${roomId}/leave`)
// };

import api from './axios';
import { Room } from '../types/room';

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

interface UpdateRoomRequest {
 roomTitle?: string;
 maxPlayers?: number;
 roomOption?: string;
 isVoice?: boolean;
}

export const roomApi = {
 getRooms: () => api.get<ApiResponse<Room[]>>('/api/room'),
 
 createRoom: (roomData: CreateRoomRequest) => 
   api.post<ApiResponse<Room>>('/api/room', roomData),
 
 getRoom: (roomId: string) => 
   api.get<ApiResponse<Room>>(`/api/room/${roomId}`),
 
 updateRoom: (roomId: string, roomData: UpdateRoomRequest) => 
   api.put<ApiResponse<Room>>(`/api/room/${roomId}`, roomData),
 
 deleteRoom: (roomId: string) => 
   api.delete<ApiResponse<null>>(`/api/room/${roomId}`)
};
