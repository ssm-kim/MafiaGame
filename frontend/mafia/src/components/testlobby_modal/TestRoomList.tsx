// import React from 'react';
import { useEffect } from 'react';
import { Room } from '@/types/room';
// import { RoomCard } from '@/components/lobby/RoomCard';

import TestRoomCard from './TestRoomCard';

interface TestRoomListProps {
  rooms: Room[];
  searchTerm: string;
  onJoinRoom: (roomId: number) => void;
}

function TestRoomList({ rooms, searchTerm, onJoinRoom }: TestRoomListProps): JSX.Element {
  useEffect(() => {
    console.log(rooms);
  }, [rooms]);
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {rooms
        .filter((room) => room.roomTitle?.toLowerCase().includes(searchTerm?.toLowerCase() || ''))
        .map((room) => (
          <TestRoomCard
            key={room.roomId}
            room={{
              roomId: room.roomId,
              roomTitle: room.roomTitle,
              peopleCnt: room.curPlayers, // curPlayers를 peopleCnt로 변환
              maxPlayer: room.maxPlayers,
            }}
            onJoin={() => onJoinRoom(room.roomId)}
          />
        ))}
    </div>
  );
}

export default TestRoomList;
