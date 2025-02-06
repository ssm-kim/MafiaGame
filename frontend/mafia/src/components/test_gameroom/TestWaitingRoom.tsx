// import React from 'react';
// import PlayerCard from './TestPlayerCard';
// import ActionButton from './TestWatingButton';
// import { Player } from '@/types/player';

// interface TestWaitingRoomProps {
//   players: Player[];
//   isHost: boolean;
//   currentPlayerId: number;
//   onReady: () => void;
//   onStart: () => void;
// }

// function TestWaitingRoom({
//   players,
//   isHost,
//   currentPlayerId,
//   onReady,
//   onStart,
// }: TestWaitingRoomProps): JSX.Element {
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
//         <div className="text-gray-400">{players.length}/8</div>
//       </div>

//       {/* 플레이어 목록 */}
//       <div className="grid grid-cols-2 gap-4 mb-8">
//         {Array.from({ length: 8 }).map((_, index) => (
//           <PlayerCard
//             key={index}
//             player={players[index]}
//             currentPlayerId={currentPlayerId}
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

// export default TestWaitingRoom;

import React from 'react';
import PlayerCard from './TestPlayerCard';
import ActionButton from './TestWatingButton';
import { Player } from '@/types/player';

interface TestWaitingRoomProps {
  players: Player[];
  isHost: boolean;
  currentPlayerId: number;
  maxPlayers: number;
  onReady: () => void;
  onStart: () => void;
}

function TestWaitingRoom({
  players,
  isHost,
  currentPlayerId,
  maxPlayers,
  onReady,
  onStart,
}: TestWaitingRoomProps): JSX.Element {
  // 8개의 슬롯을 만들고, 빈 자리는 undefined로 채움
  const paddedPlayers = [...players, ...Array(8 - players.length).fill(undefined)];

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
            key={index}
            player={player}
            currentPlayerId={currentPlayerId}
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

export default TestWaitingRoom;
