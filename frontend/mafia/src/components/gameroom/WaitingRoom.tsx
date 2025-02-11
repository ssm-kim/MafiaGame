// import React from 'react';

// import { useEffect } from 'react';
import PlayerCard from './PlayerCard';
import ActionButton from './WatingButton';
import { Player } from '@/types/player';

// interface WaitingRoomProps {
//   players: Player[];
//   isHost: boolean;
//   maxPlayers: number;
//   onReady: () => void;
//   onStart: () => void;
// }

interface WaitingRoomProps {
  players: Player[];
  isHost: boolean;
  // currentPlayerId: number;
  maxPlayers: number;
  onReady: () => Promise<void>;
  onStart: () => Promise<void>;
}

function WaitingRoom({
  players,
  isHost,
  maxPlayers,
  onReady,
  onStart,
}: WaitingRoomProps): JSX.Element {
  // 빈 자리를 포함한 전체 플레이어 배열 생성

  const paddedPlayers = [
    ...players,
    ...Array(Math.max(0, maxPlayers - players.length)).fill(undefined),
  ];

  return (
    <div className="w-full h-full bg-gray-900 bg-opacity-80 p-6">
      {/* 대기실 타이틀 */}
      <div className="mb-8 flex justify-between items-center">
        <h2
          className="text-2xl text-red-500"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          생존자 현황
        </h2>
        <div className="text-gray-400">
          {players.length}/{maxPlayers}
        </div>
      </div>

      {/* 플레이어 목록 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {paddedPlayers.map((player, index) => (
          <PlayerCard
            key={player?.id || index}
            player={player}
          />
        ))}
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-center gap-4">
        <ActionButton
          isHost={isHost}
          players={players}
          onReady={onReady}
          onStart={onStart}
        />
      </div>
    </div>
  );
}

export default WaitingRoom;

// import PlayerCard from './PlayerCard';
// import ActionButton from './WatingButton';
// import { Player } from '@/types/player';

// interface WaitingRoomProps {
//   players: Player[];
//   isHost: boolean;
//   // currentPlayerId: number;
//   maxPlayers: number;
//   onReady: () => void;
//   onStart: () => void;
// }

// function WaitingRoom({
//   players,
//   isHost,
//   // currentPlayerId,
//   maxPlayers,
//   onReady,
//   onStart,
// }: WaitingRoomProps): JSX.Element {
//   console.log('Original players:', players);
//   const paddedPlayers = [...players, ...Array(maxPlayers - players.length).fill(undefined)];
//   console.log('Padded players:', paddedPlayers);
//   return (
//     <div className="w-full h-full bg-gray-900 bg-opacity-80 p-6">
//       {/* 대기실 타이틀 */}
//       <div className="mb-8 flex justify-between items-center">
//         <h2
//           className="text-2xl text-red-500"
//           style={{ fontFamily: 'BMEuljiro10yearslater' }}
//         >
//           생존자 현황
//         </h2>
//         <div className="text-gray-400">
//           {players.length}/{maxPlayers}
//         </div>
//       </div>

//       {/* 플레이어 목록 */}
//       <div className="grid grid-cols-2 gap-4 mb-8">
//         {paddedPlayers.map((player, index) => (
//           <PlayerCard
//             key={index}
//             player={player}
//           />
//         ))}
//       </div>

//       {/* 버튼 영역 */}
//       <div className="flex justify-center gap-4">
//         <ActionButton
//           isHost={isHost}
//           players={players}
//           onReady={onReady}
//           onStart={onStart}
//         />
//       </div>
//     </div>
//   );
// }

// export default WaitingRoom;
