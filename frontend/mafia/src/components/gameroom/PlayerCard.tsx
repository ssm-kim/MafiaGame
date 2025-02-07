// import React from 'react';
// import { Player } from '@/types/player';
import { Player } from '../../types/player';
// import { GameStartResponse } from '@/types/room';

interface PlayerCardProps {
  player: Player;
  // hostId: number;
}

// export interface GameStartResponse {
//   roomId: number;
//   hostId: number;
//   readyCnt: number;
//   roomStatus: boolean;
//   participant: Record<string, Participant>;
//   gameOption: {
//     maxPlayers: number;
//     zombie: number;
//     mutant: number;
//     doctorSkillUsage: number;
//     nightTimeSec: number;
//     dayDisTimeSec: number;
//     requiredPlayers: number;
//   };
// }

function PlayerCard({ player }: PlayerCardProps): JSX.Element {
  return (
    <div
      className={`p-4 rounded-lg border
        ${player ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 bg-opacity-50 border-gray-800'}`}
    >
      {player ? (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-white">{player.nickname}</span>
            {player.isHost && <span className="text-xs text-red-500">[방장]</span>}
          </div>
          {!player.isHost && (
            <span className={`text-sm ${player.isReady ? 'text-green-500' : 'text-gray-500'}`}>
              {player.isReady ? '준비 완료' : '대기 중'}
            </span>
          )}
        </div>
      ) : (
        <div className="text-gray-600 text-center">빈 자리</div>
      )}
    </div>
  );
}

export default PlayerCard;
