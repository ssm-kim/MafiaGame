/* eslint-disable react/require-default-props */

/* eslint-disable react/require-default-props */
import { Player } from '@/types/player';

interface PlayerCardProps {
  player?: Player;
}

function PlayerCard({ player }: PlayerCardProps): JSX.Element {
  if (!player) {
    return (
      <div className="h-32 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 flex items-center justify-center">
        <span className="text-gray-500">대기중...</span>
      </div>
    );
  }

  return (
    <div className="h-32 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{player.nickname}</span>
          {player.isHost && (
            <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded">방장</span>
          )}
        </div>
        {!player.isHost && (
          <span
            className={`px-2 py-1 ${
              player.isReady ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
            } text-xs rounded`}
          >
            {player.isReady ? '준비완료' : '준비중'}
          </span>
        )}
      </div>
      <div className="text-gray-400 text-sm">참가자 #{player.participantNo}</div>
    </div>
  );
}

export default PlayerCard;

// // import React from 'react'

// import { Player } from '@/types/player';

// interface PlayerCardProps {
//   player?: Player;
// }

// function PlayerCard({ player }: PlayerCardProps): JSX.Element {
//   return (
//     <div
//       className={`p-4 rounded-lg border
//         ${player ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 bg-opacity-50 border-gray-800'}`}
//     >
//       {player ? (
//         <div className="flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <span className="text-white">{player.nickname}</span>
//             {player.isHost && <span className="text-xs text-red-500">[방장]</span>}
//           </div>
//           {!player.isHost && (
//             <span className={`text-sm ${player.isReady ? 'text-green-500' : 'text-gray-500'}`}>
//               {player.isReady ? '준비 완료' : '대기 중'}
//             </span>
//           )}
//         </div>
//       ) : (
//         <div className="text-gray-600 text-center">빈 자리</div>
//       )}
//     </div>
//   );
// }

// export default PlayerCard;

// import { Player } from '@/types/player';

// interface PlayerCardProps {
//   player?: Player;
//   // hostId: number;
// }

// function PlayerCard({ player = undefined }: PlayerCardProps): JSX.Element {
//   console.log('-------------');
//   console.log('PlayerCard player:', player);
//   return (
//     <div
//       className={`p-4 rounded-lg border
//         ${player ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 bg-opacity-50 border-gray-800'}`}
//     >
//       {player ? (
//         <div className="flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <span className="text-white">{player.nickname}</span>
//             {player.isHost && <span className="text-xs text-red-500">[방장]</span>}
//           </div>
//           {!player.isHost && (
//             <span className={`text-sm ${player.isReady ? 'text-green-500' : 'text-gray-500'}`}>
//               {player.isReady ? '준비 완료' : '대기 중'}
//             </span>
//           )}
//         </div>
//       ) : (
//         <div className="text-gray-600 text-center">빈 자리</div>
//       )}
//     </div>
//   );
// }

// export default PlayerCard;
