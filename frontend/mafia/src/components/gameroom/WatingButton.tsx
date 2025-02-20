import { Player } from '@/types/player';

interface WaitingButtonProps {
  isHost: boolean;
  players: Player[];
  onReady: () => Promise<void>;
  onStart: () => Promise<void>;
  participantNo?: number | null;
}

function WaitingButton({
  isHost,
  players,
  onReady,
  onStart,
  participantNo,
}: WaitingButtonProps): JSX.Element {
  // 호스트를 제외한 다른 플레이어들의 준비 상태 확인
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const allPlayersReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);

  // 현재 플레이어의 준비 상태 확인
  const currentPlayer = players.find((p) => p.participantNo === participantNo);
  const currentPlayerReady = currentPlayer?.isReady || false;

  if (isHost) {
    return (
      <button
        type="button"
        onClick={() => onStart()}
        disabled={!allPlayersReady || players.length < 2}
        className={`px-8 py-3 rounded-lg text-white font-bold
          ${
            allPlayersReady && players.length >= 2
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-600 cursor-not-allowed'
          }
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
      onClick={() => onReady()}
      className={`px-8 py-3 rounded-lg text-white font-bold
        ${currentPlayerReady ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}
        transition-colors duration-200`}
      style={{ fontFamily: 'BMEuljiro10yearslater' }}
    >
      {currentPlayerReady ? '준비 완료' : '준비'}
    </button>
  );
}

export default WaitingButton;
