// import React from 'react';
// import { Room } from '@/types/room';

interface RoomCardProps {
  room: {
    roomId: number;
    roomTitle: string;
    curPlayers: number;
  };
  onJoin: (roomId: number) => void;
}

function RoomCard({ room, onJoin }: RoomCardProps): JSX.Element {
  return (
    <div
      className="p-4 bg-gray-800 bg-opacity-90 rounded-lg text-white hover:bg-gray-700 cursor-pointer border border-gray-700 transform hover:scale-102 transition-all duration-200"
      onClick={() => onJoin(room.roomId)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          onJoin(room.roomId);
        }
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-medium mb-1">{room.roomTitle}</div>
          <div className="text-sm text-gray-400">방 번호: {room.roomId}</div>
        </div>
        <div className="bg-red-900 px-3 py-1 rounded-full text-sm">{room.curPlayers} / 4</div>
      </div>
    </div>
  );
}
export default RoomCard;
