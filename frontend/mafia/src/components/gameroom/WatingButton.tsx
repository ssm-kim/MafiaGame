// import React from 'react';
import { Player } from '@/types/player';

interface WatingButtonProps {
  isHost: boolean;
  players: Player[];
  onReady: () => void;
  onStart: () => void;
}

function WatingButton({ isHost, players, onReady, onStart }: WatingButtonProps): JSX.Element {
  if (isHost) {
    // 호스트를 제외한 다른 플레이어들의 준비 상태만 확인
    const nonHostPlayers = players.filter((p) => !p.isHost);
    const allPlayersReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);

    return (
      <button
        type="button"
        onClick={onStart}
        disabled={!allPlayersReady}
        className={`px-8 py-3 rounded-lg text-white font-bold
            ${allPlayersReady ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'}
            transition-colors duration-200`}
        style={{ fontFamily: 'BMEuljiro10yearslater' }}
      >
        게임 시작
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onReady}
      className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors duration-200"
      style={{ fontFamily: 'BMEuljiro10yearslater' }}
    >
      준비
    </button>
  );
}

export default WatingButton;

// // import React from 'react';
// import { Player } from '@/types/player';

// interface WatingButtonProps {
//   isHost: boolean;
//   players: Player[];
//   onReady: () => void;
//   onStart: () => void;
// }

// function WatingButton({ isHost, players, onReady, onStart }: WatingButtonProps): JSX.Element {
//   if (isHost) {
//     const allReady = players.every((p) => p.isReady || p.isHost);
//     return (
//       <button
//         type="button"
//         onClick={onStart}
//         disabled={!allReady}
//         className={`px-8 py-3 rounded-lg text-white font-bold
//             ${allReady ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'}
//             transition-colors duration-200`}
//         style={{ fontFamily: 'BMEuljiro10yearslater' }}
//       >
//         게임 시작
//       </button>
//     );
//   }

//   return (
//     <button
//       type="button"
//       onClick={onReady}
//       className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors duration-200"
//       style={{ fontFamily: 'BMEuljiro10yearslater' }}
//     >
//       준비
//     </button>
//   );
// }

// export default WatingButton;
