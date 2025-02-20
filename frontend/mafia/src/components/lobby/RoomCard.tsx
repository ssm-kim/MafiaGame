interface RoomCardProps {
  room: {
    roomId: number;
    roomTitle: string;
    curPlayers: number;
    requiredPlayers: number;
    hasPassword: boolean;
  };
  onJoin: (roomId: number) => void;
}

function RoomCard({ room, onJoin }: RoomCardProps): JSX.Element {
  //console.log('Room hasPassword:', room.hasPassword);
  //console.log('RoomCard received room:', room);
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
          <div className="text-xl font-medium mb-1 flex items-center gap-2">
            {room.roomTitle}
            {room.hasPassword && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-yellow-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="text-sm text-gray-400">방 번호: {room.roomId}</div>
        </div>
        <div className="bg-red-900 px-3 py-1 rounded-full text-sm">
          {room.curPlayers} / {room.requiredPlayers}
        </div>
      </div>
    </div>
  );
}

export default RoomCard;


