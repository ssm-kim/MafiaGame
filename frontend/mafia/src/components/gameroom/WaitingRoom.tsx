import React from 'react';
import PlayerCard from './PlayerCard';
import ActionButton from './WatingButton';
import { Player } from '@/types/player';

interface WaitingRoomProps {
  players: Player[];
  isHost: boolean;
  requiredPlayers: number;
  onReady: () => Promise<void>;
  onStart: () => Promise<void>;
}

function WaitingRoom({
  players,
  isHost,
  requiredPlayers,
  onReady,
  onStart,
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
            // player가 있으면 player.id를, 없으면 `empty-${index}`를 키로 사용
            key={player ? `player-${player.id}` : `empty-${index}`}
            className="w-full"
          >
            <PlayerCard
              player={player}
              className="w-full min-h-[120px] md:min-h-[150px] lg:min-h-[180px]"
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
          className="w-32"
        />
      </div>
    </div>
  );
}

export default WaitingRoom;
