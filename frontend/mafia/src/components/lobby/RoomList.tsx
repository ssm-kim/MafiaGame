import { Room } from '@/types/room';
import RoomCard from './RoomCard';

interface RoomListProps {
  rooms: Room[];
  searchTerm: string;
  onJoinRoom: (roomId: number) => void;
}
// RoomList.tsx
export function RoomList({ rooms, searchTerm, onJoinRoom }: RoomListProps): JSX.Element {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {rooms
        .filter((room) => room.roomTitle?.toLowerCase().includes(searchTerm?.toLowerCase() || ''))
        .map((room) => {
          return (
            <RoomCard
              key={room.roomId}
              room={{
                roomId: room.roomId,
                roomTitle: room.roomTitle,
                curPlayers: room.peopleCnt || 0,
                requiredPlayers: room.requiredPlayers,
                hasPassword: room.hasPassword, // true로 고정하지 말고 room에서 받은 값 사용
              }}
              onJoin={onJoinRoom}
            />
          );
        })}
    </div>
  );
}

export default RoomList;
