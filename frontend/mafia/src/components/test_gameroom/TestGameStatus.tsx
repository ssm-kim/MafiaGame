import { Room } from '@/types/room';

interface TestGameStatusProps {
  gameState: Room;
}

const TestGameStatus: React.FC<TestGameStatusProps> = ({ gameState }) => (
  <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 p-3 rounded-lg border border-gray-800">
    <h2
      className="text-red-500 text-lg mb-2"
      style={{ fontFamily: 'BMEuljiro10yearslater' }}
    >
      현재 상황
    </h2>
    <div className="space-y-1 text-sm">
      <p className="text-gray-300 text-sm">
        게임 상태: {gameState.roomStatus ? '진행 중' : '대기 중'}
      </p>
    </div>
  </div>
);

export default TestGameStatus;
