// import React from 'react';
// import { Room } from '@/types/room';

interface RoomCardProps {
  room: {
    roomId: number;
    roomTitle: string;
    curPlayers: number;
    requiredPlayers: number;
    // isStart: boolean;
    roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
  };
  onJoin: (roomId: number) => void;
}

function RoomCard({ room, onJoin }: RoomCardProps): JSX.Element {
  const isJoinable = room.roomStatus === 'WAITING';
  console.log('RoomCard received room:', room);
  //   return (
  //     <div
  //       className="p-4 bg-gray-800 bg-opacity-90 rounded-lg text-white hover:bg-gray-700 cursor-pointer border border-gray-700 transform hover:scale-102 transition-all duration-200"
  //       onClick={() => isWaiting && onJoin(room.roomId)}
  //       role="button"
  //       tabIndex={0}
  //       onKeyPress={(e) => {
  //         if (e.key === 'Enter' && isWaiting) {
  //           onJoin(room.roomId);
  //         }
  //       }}
  //     >
  //       <div className="flex justify-between items-center">
  //         <div className="flex-1">
  //           <div className="text-xl font-medium mb-1">{room.roomTitle}</div>
  //           <div className="text-sm text-gray-400">방 번호: {room.roomId}</div>
  //         </div>
  //         <div className="flex flex-col items-end gap-2">
  //           <div className="bg-red-900 px-3 py-1 rounded-full text-sm">
  //             {room.curPlayers} / {room.requiredPlayers}
  //           </div>
  //           <div
  //             className={`px-3 py-1 rounded-full text-sm ${
  //               isWaiting ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
  //             }`}
  //           >
  //             {isWaiting ? '대기중' : '게임중'}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  return (
    <div
      className={`p-4 bg-gray-800 bg-opacity-90 rounded-lg text-white border border-gray-700 
      transition-all duration-200 ${
        isJoinable
          ? 'hover:bg-gray-700 cursor-pointer hover:scale-102'
          : 'opacity-75 cursor-not-allowed'
      }`}
      onClick={() => isJoinable && onJoin(room.roomId)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && isJoinable) {
          onJoin(room.roomId);
        }
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="text-xl font-medium mb-1">{room.roomTitle}</div>
          <div className="text-sm text-gray-400">방 번호: {room.roomId}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-red-900 px-3 py-1 rounded-full text-sm">
            {room.curPlayers} / {room.requiredPlayers}
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm ${
              room.roomStatus === 'WAITING'
                ? 'bg-green-900 text-green-300'
                : room.roomStatus === 'PLAYING'
                  ? 'bg-yellow-900 text-yellow-300'
                  : 'bg-gray-900 text-gray-300'
            }`}
          >
            {room.roomStatus === 'WAITING'
              ? '대기중'
              : room.roomStatus === 'PLAYING'
                ? '게임중'
                : '종료됨'}
          </div>
        </div>
      </div>
    </div>
  );
}
export default RoomCard;
