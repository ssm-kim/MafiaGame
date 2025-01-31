import React from 'react';
import { Room } from '@/types/room';

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  return (
    <div
      className="p-4 bg-gray-800 bg-opacity-90 rounded-lg text-white hover:bg-gray-700 cursor-pointer border border-gray-700 transform hover:scale-102 transition-all duration-200"
      onClick={() => onJoin(room.id)}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-medium mb-1">{room.name}</div>
          <div className="text-sm text-gray-400">방 번호: {room.id}</div>
        </div>
        <div className="bg-red-900 px-3 py-1 rounded-full text-sm">
          {room.currentPlayers} / {room.maxPlayers}
        </div>
      </div>
    </div>
  );
}

export default RoomCard;
