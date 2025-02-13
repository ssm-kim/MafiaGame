/* eslint-disable react/require-default-props */
import { Player } from '@/types/player';

interface PlayerCardProps {
  player?: Player;
  isHost?: boolean;
  onKick?: (playerNo: number) => void;
}

function PlayerCard({ player, isHost, onKick }: PlayerCardProps): JSX.Element {
  return (
    <div
      className={`p-4 rounded-lg border relative group
       ${player ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 bg-opacity-50 border-gray-800'}`}
    >
      {player ? (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-white">{player.nickname}</span>
            {player.isHost && <span className="text-xs text-red-500">[방장]</span>}
          </div>
          <div className="flex items-center gap-3">
            {!player.isHost && (
              <span className={`text-sm ${player.isReady ? 'text-green-500' : 'text-gray-500'}`}>
                {player.isReady ? '준비 완료' : '대기 중'}
              </span>
            )}
            {/* 강퇴 버튼 - 방장에게만 보이고 방장은 강퇴할 수 없음 */}
            {isHost && !player.isHost && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onKick?.(player.participantNo);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                         hover:text-red-500 p-1 rounded-full hover:bg-red-500/10
                         w-6 h-6 flex items-center justify-center text-sm font-bold"
                title="강퇴하기"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-600 text-center">빈 자리</div>
      )}
    </div>
  );
}

export default PlayerCard;
