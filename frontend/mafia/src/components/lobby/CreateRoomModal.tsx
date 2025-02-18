// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect } from 'react';

export interface CreateRoomModalProps {
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

// 인원수별 역할 제한 설정
const ROLE_LIMITS = {
  6: { minZombie: 1, maxZombie: 2, minMutant: 0, maxMutant: 1, doctor: 2 },
  7: { minZombie: 1, maxZombie: 2, minMutant: 0, maxMutant: 1, doctor: 2 },
  8: { minZombie: 1, maxZombie: 2, minMutant: 0, maxMutant: 1, doctor: 2 },
};

export function CreateRoomModal({
  show,
  onClose,
  roomData,
  onRoomDataChange,
  onCreateRoom,
}: CreateRoomModalProps) {
  useEffect(() => {
    // 인원수가 변경될 때마다 역할 수 자동 조정
    const limits = ROLE_LIMITS[roomData.requiredPlayers as keyof typeof ROLE_LIMITS];
    if (limits) {
      const newGameOption = {
        ...roomData.gameOption,
        zombie: Math.min(Math.max(roomData.gameOption.zombie, limits.minZombie), limits.maxZombie),
        mutant: Math.min(Math.max(roomData.gameOption.mutant, limits.minMutant), limits.maxMutant),
        doctorSkillUsage: limits.doctor,
      };

      if (JSON.stringify(newGameOption) !== JSON.stringify(roomData.gameOption)) {
        onRoomDataChange({
          ...roomData,
          gameOption: newGameOption,
        });
      }
    }
  }, [roomData.requiredPlayers]);

  if (!show) return null;

  const handleRequiredPlayersChange = (value: string) => {
    const players = parseInt(value);
    if (players >= 6 && players <= 8) {
      onRoomDataChange({ ...roomData, requiredPlayers: players });
    }
  };

  const handleRoleChange = (role: 'zombie' | 'mutant', value: string) => {
    const numValue = parseInt(value);
    const limits = ROLE_LIMITS[roomData.requiredPlayers as keyof typeof ROLE_LIMITS];

    if (!limits) return;

    let validValue;
    if (role === 'zombie') {
      validValue = Math.min(Math.max(numValue, limits.minZombie), limits.maxZombie);
    } else {
      validValue = Math.min(Math.max(numValue, limits.minMutant), limits.maxMutant);
    }

    onRoomDataChange({
      ...roomData,
      gameOption: {
        ...roomData.gameOption,
        [role]: validValue,
      },
    });
  };
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-ignore
  const getLimitText = (requiredPlayers: number) => {
    const limits = ROLE_LIMITS[requiredPlayers as keyof typeof ROLE_LIMITS];
    if (!limits) return '';

    return (
      `좀비: ${limits.minZombie}-${limits.maxZombie}명, ` +
      `돌연변이: ${limits.minMutant}-${limits.maxMutant}명, ` +
      `보건교사: ${limits.doctor}명`
    );
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const isValidForm = () => {
    if (roomData.title.trim() === '') return false;

    const limits = ROLE_LIMITS[roomData.requiredPlayers as keyof typeof ROLE_LIMITS];
    if (!limits) return false;

    return (
      roomData.gameOption.zombie >= limits.minZombie &&
      roomData.gameOption.zombie <= limits.maxZombie &&
      roomData.gameOption.mutant >= limits.minMutant &&
      roomData.gameOption.mutant <= limits.maxMutant &&
      roomData.gameOption.doctorSkillUsage === limits.doctor
    );
  };

  const handleCreateRoom = () => {
    if (!isValidForm()) {
      alert('입력 값을 확인해주세요.');
      return;
    }
    onCreateRoom();
  };

  const currentLimits =
    ROLE_LIMITS[roomData.requiredPlayers as keyof typeof ROLE_LIMITS] || ROLE_LIMITS[6];

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
                placeholder="대피소 이름을 입력하세요"
              />
            </label>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              생존자 수 (6-8명)
              <input
                type="number"
                min="4"
                max="8"
                className="mt-2 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                value={roomData.requiredPlayers}
                onChange={(e) => handleRequiredPlayersChange(e.target.value)}
              />
            </label>
            {/* <p className="text-yellow-500 text-sm mt-1">
              현재 설정: {getLimitText(roomData.requiredPlayers)}
            </p> */}
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              비밀번호 (선택사항)
              <input
                type="password"
                className="mt-2 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                value={roomData.password}
                onChange={(e) => onRoomDataChange({ ...roomData, password: e.target.value })}
                placeholder="비밀번호를 설정하지 않으면 공개방이 됩니다"
              />
            </label>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">생존자 역할 분배</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  min={currentLimits.minZombie}
                  max={currentLimits.maxZombie}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.gameOption.zombie}
                  onChange={(e) => handleRoleChange('zombie', e.target.value)}
                />
                <span className="text-sm text-gray-400 mt-1 block">좀비</span>
              </div>
              <div>
                <input
                  type="number"
                  min={currentLimits.minMutant}
                  max={currentLimits.maxMutant}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                  value={roomData.gameOption.mutant}
                  onChange={(e) => handleRoleChange('mutant', e.target.value)}
                />
                <span className="text-sm text-gray-400 mt-1 block">돌연변이</span>
              </div>
              <div>
                <input
                  type="number"
                  readOnly
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                  value={currentLimits.doctor}
                />
                <span className="text-sm text-gray-400 mt-1 block">백신 개수</span>
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
              className={`px-6 py-2 ${
                isValidForm() ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600/50 cursor-not-allowed'
              } text-white rounded-lg transition-colors duration-200`}
              onClick={handleCreateRoom}
              disabled={!isValidForm()}
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
