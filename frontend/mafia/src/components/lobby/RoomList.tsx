// import React from 'react';
import { Room } from '@/types/room';
// import { RoomCard } from '@/components/lobby/RoomCard';

import RoomCard from './RoomCard';

interface RoomListProps {
  rooms: Room[];
  searchTerm: string;
  onJoinRoom: (roomId: number) => void;
}

export function RoomList({ rooms, searchTerm, onJoinRoom }: RoomListProps): JSX.Element {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {rooms
        .filter((room) => room.roomTitle?.toLowerCase().includes(searchTerm?.toLowerCase() || ''))
        .map((room) => (
          <RoomCard
            key={room.roomId}
            room={room}
            onJoin={() => onJoinRoom(room.roomId)}
          />
        ))}
    </div>
  );
}

export default RoomList;
