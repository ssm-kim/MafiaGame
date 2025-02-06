import React from 'react';
import { Room } from '@/types/room';

interface TestGameHeaderProps {
  roomId: string;
  gameState: Room | null;
  onLeave: () => void;
}

function TestGameHeader({ roomId, gameState, onLeave }: TestGameHeaderProps): JSX.Element {
  return (
    <div className="absolute top-0 left-0 right-0 bg-gray-900 bg-opacity-90 p-4 flex justify-between items-center border-b border-gray-800">
      <div className="flex items-center gap-4">
        <span
          className="text-red-500"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          대피소 #{roomId}
        </span>
        {gameState && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-gray-300">{gameState.roomTitle}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* <div className="text-gray-400 text-sm">
          생존자: {gameState.curPlayers} / {gameState.maxPlayers}
        </div> */}
        <button
          type="button"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200"
          onClick={onLeave}
        >
          대피소 나가기
        </button>
      </div>
    </div>
  );
}

export default TestGameHeader;
