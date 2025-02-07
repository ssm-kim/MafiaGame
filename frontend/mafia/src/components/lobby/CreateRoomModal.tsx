// import React from 'react';

{
  /* eslint-disable-next-line jsx-a11y/label-has-associated-control */
}

interface CreateRoomModalProps {
  show: boolean;
  onClose: () => void;
  roomData: {
    name: string;
    maxPlayers: number;
    password: string;
    mafia: number;
    police: number;
    doctor: number;
    dayTime: number;
    nightTime: number;
    voteTime: number;
  };
  onRoomDataChange: (data: CreateRoomModalProps['roomData']) => void;
  onCreateRoom: () => void;
}

export function CreateRoomModal({
  show,
  onClose,
  roomData,
  onRoomDataChange,
  onCreateRoom,
}: CreateRoomModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-lg border border-gray-800">
        <h2
          className="text-2xl font-bold text-red-500 mb-6 text-center"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          새로운 대피소 생성
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="roomName"
              className="block text-gray-300"
            >
              대피소 이름
              <input
                id="roomName"
                type="text"
                className="mt-2 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                value={roomData.name}
                onChange={(e) => onRoomDataChange({ ...roomData, name: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">최대 생존자 수</label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
              value={roomData.maxPlayers}
              onChange={(e) =>
                onRoomDataChange({ ...roomData, maxPlayers: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">보안 코드</label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
              value={roomData.password}
              onChange={(e) => onRoomDataChange({ ...roomData, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">생존자 역할 분배</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.mafia}
                  onChange={(e) =>
                    onRoomDataChange({ ...roomData, mafia: parseInt(e.target.value) })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">감염자</span>
              </div>
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.police}
                  onChange={(e) =>
                    onRoomDataChange({ ...roomData, police: parseInt(e.target.value) })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">보안요원</span>
              </div>
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.doctor}
                  onChange={(e) =>
                    onRoomDataChange({ ...roomData, doctor: parseInt(e.target.value) })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">의무관</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">생존 시간 설정</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.dayTime}
                  onChange={(e) =>
                    onRoomDataChange({ ...roomData, dayTime: parseInt(e.target.value) })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">주간</span>
              </div>
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.nightTime}
                  onChange={(e) =>
                    onRoomDataChange({ ...roomData, nightTime: parseInt(e.target.value) })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">야간</span>
              </div>
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.voteTime}
                  onChange={(e) =>
                    onRoomDataChange({ ...roomData, voteTime: parseInt(e.target.value) })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">투표</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <button
              type="button"
              className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              onClick={onCreateRoom}
            >
              생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateRoomModal;
