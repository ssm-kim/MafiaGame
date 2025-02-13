import PlayerCard from './PlayerCard';
import ActionButton from './WatingButton';
import { Player } from '@/types/player';
import roomApi from '@/api/roomApi';

interface WaitingRoomProps {
  players: Player[];
  isHost: boolean;
  requiredPlayers: number;
  onReady: () => Promise<void>;
  onStart: () => Promise<void>;
  roomId: number;
}

function WaitingRoom({
  players,
  isHost,
  requiredPlayers,
  onReady,
  onStart,
  roomId,
}: WaitingRoomProps): JSX.Element {
  console.log('WaitingRoom - props:', { isHost, players });
  const paddedPlayers = [
    ...players,
    ...Array(Math.max(0, requiredPlayers - players.length)).fill(undefined),
  ];

  return (
    <div className="w-full h-full bg-gray-900 bg-opacity-80 p-4 flex flex-col">
      {/* 생존자 현황 헤더 */}
      <div className="flex flex-nowrap justify-between items-center mb-6">
        <h2
          className="text-xl text-red-500 whitespace-nowrap"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          생존자 현황
        </h2>
        <span className="text-gray-400 ml-2 whitespace-nowrap">
          {players.length}/{requiredPlayers}
        </span>
      </div>

      {/* 플레이어 그리드 - 화면을 최대한 활용 */}
      <div className="grid grid-cols-2 gap-4 mb-6 flex-grow w-full px-2">
        {paddedPlayers.map((player, index) => (
          <div
            key={player ? `player-${player.id}` : `empty-${index}`}
            className="w-full"
          >
            <PlayerCard
              player={player}
              isHost={isHost}
              onKick={async (playerNo) => {
                if (!roomId) {
                  console.error('방 ID가 없습니다');
                  return;
                }

                if (confirm('정말 강퇴하시겠습니까?')) {
                  try {
                    console.log('강퇴 시도 - 상세정보:', {
                      roomId,
                      playerNo,
                      isHost,
                    });
                    await roomApi.kickMember(roomId, playerNo);
                  } catch (error) {
                    console.error('강퇴 처리 중 오류:', error);
                    alert('강퇴 처리 중 오류가 발생했습니다.');
                  }
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* 준비/시작 버튼 */}
      <div className="flex justify-center mt-auto pb-4">
        <ActionButton
          isHost={isHost}
          players={players}
          onReady={onReady}
          onStart={onStart}
          // className="w-32"
        />
      </div>
    </div>
  );
}

export default WaitingRoom;
