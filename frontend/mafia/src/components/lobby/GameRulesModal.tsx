import { useState } from 'react';
import { Skull, Users, Shield, HeartPulse, Sun, Moon, Timer } from 'lucide-react';

interface GameRulesModalProps {
  show: boolean;
  onClose: () => void;
}

function GameRulesModal({ show, onClose }: GameRulesModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />

      <div className="relative bg-gray-900 w-full max-w-4xl rounded-lg shadow-2xl border-2 border-red-800 overflow-hidden">
        {/* Header */}
        <div className="bg-red-900 p-4 border-b-2 border-red-800">
          <h2
            className="text-2xl text-red-100 text-center font-bold"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            학교 비상 대책 안내
          </h2>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-red-800">
          <button
            type="button"
            className={`flex-1 p-3 text-sm ${
              activeTab === 'overview'
                ? 'bg-red-900/40 text-red-100'
                : 'bg-gray-800/40 text-gray-300'
            } transition-colors hover:bg-red-800/50`}
            onClick={() => setActiveTab('overview')}
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            게임 개요
          </button>

          <button
            type="button"
            className={`flex-1 p-3 text-sm ${
              activeTab === 'roles' ? 'bg-red-900/40 text-red-100' : 'bg-gray-800/40 text-gray-300'
            } transition-colors hover:bg-red-800/50`}
            onClick={() => setActiveTab('roles')}
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            역할
          </button>

          <button
            type="button"
            className={`flex-1 p-3 text-sm ${
              activeTab === 'rules' ? 'bg-red-900/40 text-red-100' : 'bg-gray-800/40 text-gray-300'
            } transition-colors hover:bg-red-800/50`}
            onClick={() => setActiveTab('rules')}
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            생존 규칙
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto text-gray-300 custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                <h3
                  className="text-xl text-red-400 mb-2"
                  style={{ fontFamily: 'BMEuljiro10yearslater' }}
                >
                  감염된 학교의 마지막 생존자들
                </h3>
                <p className="text-sm leading-relaxed">
                  학교는 좀비 바이러스에 감염되었고, 소수의 학생들만이 남았습니다. 하지만 학생들
                  중에는 이미 감염된 자들이 숨어있습니다. 진정한 생존자들은 감염자들을 찾아내야
                  하고, 감염자들은 남은 생존자들을 감염시키려 합니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-red-400" />
                    <span
                      className="text-red-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      추천 인원
                    </span>
                  </div>
                  <p className="text-sm">4-8명의 생존자</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="text-red-400" />
                    <span
                      className="text-red-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      게임 시간
                    </span>
                  </div>
                  <p className="text-sm">약 15-20분</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Skull className="text-red-400" />
                    <span
                      className="text-lg text-red-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      감염자
                    </span>
                  </div>
                  <p className="text-sm">정체를 숨기고 다른 생존자들을 감염시켜야 합니다.</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-blue-400" />
                    <span
                      className="text-lg text-blue-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      생존자
                    </span>
                  </div>
                  <p className="text-sm">감염자를 찾아내어 모든 위협으로부터 생존해야 합니다.</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-yellow-400" />
                    <span
                      className="text-lg text-yellow-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      담임 선생님
                    </span>
                  </div>
                  <p className="text-sm">밤중에 다른 생존자의 감염 여부를 확인할 수 있습니다.</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <HeartPulse className="text-green-400" />
                    <span
                      className="text-lg text-green-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      보건 교사
                    </span>
                  </div>
                  <p className="text-sm">
                    밤중에 한 명의 생존자를 감염으로부터 보호할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="text-yellow-400" />
                  <span
                    className="text-lg text-yellow-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    낮 시간
                  </span>
                </div>
                <ul className="text-sm space-y-2">
                  <li>• 생존자들이 모여 감염자를 찾기 위한 회의를 진행합니다.</li>
                  <li>• 의심되는 생존자를 지목하여 투표를 진행합니다.</li>
                  <li>• 과반수 이상의 투표를 받은 생존자는 격리됩니다.</li>
                </ul>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="text-blue-400" />
                  <span
                    className="text-lg text-blue-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    밤 시간
                  </span>
                </div>
                <ul className="text-sm space-y-2">
                  <li>• 감염자들은 한 명의 생존자를 감염시킵니다.</li>
                  <li>• 담임 선생님은 한 명의 감염 여부를 확인합니다.</li>
                  <li>• 보건 교사는 한 명의 생존자를 보호합니다.</li>
                </ul>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-red-800">
                <h3
                  className="text-lg text-red-400 mb-2"
                  style={{ fontFamily: 'BMEuljiro10yearslater' }}
                >
                  승리 조건
                </h3>
                <ul className="text-sm space-y-2">
                  <li>• 생존자 승리: 모든 감염자를 찾아내어 격리</li>
                  <li>• 감염자 승리: 생존자의 수가 감염자의 수와 같아질 때</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 p-4 border-t border-red-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-red-900 text-red-100 rounded hover:bg-red-800 transition-colors"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameRulesModal;
