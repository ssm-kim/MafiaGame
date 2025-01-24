import { Room } from "../../types/room";
import { RoomCard } from "./RoomCard";
interface RoomListProps {
    rooms: Room[];
    searchTerm: string;
    onJoinRoom: (roomId: string) => void;
  }
  
  export const RoomList = ({ rooms, searchTerm, onJoinRoom }: RoomListProps) => (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {rooms
        .filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(room => (
          <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
        ))}
    </div>
  );