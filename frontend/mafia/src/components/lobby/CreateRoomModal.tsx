interface CreateRoomModalProps {
  show: boolean;
  onClose: () => void;
  roomData: {
    title: string;
    requiredPlayers: number;
    password: string;
    gameOption: {
      zombie: number;
      mutant: number;
      doctorSkillUsage: number;
      nightTimeSec: number;
      dayDisTimeSec: number;
    };
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
                value={roomData.title}
                onChange={(e) => onRoomDataChange({ ...roomData, title: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">최대 생존자 수</label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
              value={roomData.requiredPlayers}
              onChange={(e) =>
                onRoomDataChange({ ...roomData, requiredPlayers: parseInt(e.target.value) })
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
                  value={roomData.gameOption.zombie}
                  onChange={(e) =>
                    onRoomDataChange({
                      ...roomData,
                      gameOption: {
                        ...roomData.gameOption,
                        zombie: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">좀비</span>
              </div>
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.gameOption.mutant}
                  onChange={(e) =>
                    onRoomDataChange({
                      ...roomData,
                      gameOption: {
                        ...roomData.gameOption,
                        mutant: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">돌연변이</span>
              </div>
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.gameOption.doctorSkillUsage}
                  onChange={(e) =>
                    onRoomDataChange({
                      ...roomData,
                      gameOption: {
                        ...roomData.gameOption,
                        doctorSkillUsage: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">보건 교사</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">타이머 설정</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.gameOption.nightTimeSec}
                  onChange={(e) =>
                    onRoomDataChange({
                      ...roomData,
                      gameOption: {
                        ...roomData.gameOption,
                        nightTimeSec: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">밤(초)</span>
              </div>
              <div>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.gameOption.dayDisTimeSec}
                  onChange={(e) =>
                    onRoomDataChange({
                      ...roomData,
                      gameOption: {
                        ...roomData.gameOption,
                        dayDisTimeSec: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-sm text-gray-400 mt-1 block">낮(초)</span>
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
