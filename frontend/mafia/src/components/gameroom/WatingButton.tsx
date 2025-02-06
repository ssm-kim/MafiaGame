import React from 'react';

interface WatingButtonProps {
  isHost: boolean;
  players: Player[];
  onReady: () => void;
  onStart: () => void;
}

function WatingButton({ isHost, players, onReady, onStart }: WatingButtonProps): JSX.Element {
  if (isHost) {
    const allReady = players.every((p) => p.isReady || p.isHost);
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={!allReady}
        className={`px-8 py-3 rounded-lg text-white font-bold
            ${allReady ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'}
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
