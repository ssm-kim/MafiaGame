import React from 'react';
import PlayerCard from './PlayerCard';
import ActionButton from './WatingButton';
import { Player } from '@/types/player';

interface WaitingRoomProps {
  players: Player[];
  isHost: boolean;
  currentPlayerId: number;
  onReady: () => void;
  onStart: () => void;
}

function WaitingRoom({
  players,
  isHost,
  currentPlayerId,
  onReady,
  onStart,
}: WaitingRoomProps): JSX.Element {
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
        <div className="text-gray-400">{players.length}/8</div>
      </div>

      {/* 플레이어 목록 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <PlayerCard
            key={index}
            player={players[index]}
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

export default WaitingRoom;
