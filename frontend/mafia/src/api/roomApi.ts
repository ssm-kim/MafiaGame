// import api from './axios';
// import { Room } from '../types/room';

// export const roomApi = {
//   getRooms: () => api.get<Room[]>('/rooms'),
//   createRoom: (room: Partial<Room>) => api.post<Room>('/rooms', room),
//   getRoom: (roomId: string) => api.get<Room>(`/rooms/${roomId}`),
//   joinRoom: (roomId: string) => api.post(`/rooms/${roomId}/join`),
//   leaveRoom: (roomId: string) => api.post(`/rooms/${roomId}/leave`)
// };

import { Room } from '../types/room';

let mockRooms: Room[] = [
  { 
    id: '1', 
    name: '게임방 1', 
    currentPlayers: 3, 
    maxPlayers: 8,
    gameStatus: 'WAITING',
    password: ''
  },
  { 
    id: '2', 
    name: '게임방 2', 
    currentPlayers: 5, 
    maxPlayers: 8,
    gameStatus: 'WAITING',
    password: '1234'
  },
  { 
    id: '3', 
    name: '게임방 3', 
    currentPlayers: 4, 
    maxPlayers: 8,
    gameStatus: 'WAITING',
    password: ''
  },
  { 
    id: '4', 
    name: '게임방 4', 
    currentPlayers: 8, 
    maxPlayers: 8,
    gameStatus: 'WAITING',
    password: ''
  },
];

export const roomApi = {
  getRooms: () => Promise.resolve({ data: mockRooms }),
  createRoom: (room: Partial<Room>) => {
    const newRoom = {
      id: String(mockRooms.length + 1),
      name: room.name || '',
      currentPlayers: 1,
      maxPlayers: room.maxPlayers || 8,
      gameStatus: 'WAITING',
      password: room.password || '',
      mafia: room.mafia || 2,
      police: room.police || 1,
      doctor: room.doctor || 1,
      dayTime: room.dayTime || 180,
      nightTime: room.nightTime || 180,
      voteTime: room.voteTime || 60
    };
    mockRooms.push(newRoom);
    return Promise.resolve({ data: newRoom });
  },
  getRoom: (roomId: string) => 
    Promise.resolve({ data: mockRooms.find(r => r.id === roomId) }),
  joinRoom: (roomId: string) => 
    Promise.resolve({ data: mockRooms.find(r => r.id === roomId) }),
  leaveRoom: (roomId: string) => Promise.resolve({ data: true })
};