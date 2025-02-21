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
        className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-gray-900 w-full max-w-4xl rounded-lg shadow-2xl border-2 border-red-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 p-6 border-b-2 border-red-800">
          <h2
            className="text-3xl text-red-100 text-center font-bold drop-shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            <Shield className="h-8 w-8" />
            학교 비상 대책 안내
          </h2>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-red-800">
          {[
            { id: 'overview', icon: <Users size={18} />, label: '게임 개요' },
            { id: 'roles', icon: <Skull size={18} />, label: '역할' },
            { id: 'rules', icon: <Shield size={18} />, label: '생존 규칙' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`flex-1 p-4 text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-red-900/40 text-red-100 border-b-2 border-red-500'
                  : 'bg-gray-800/40 text-gray-300 hover:bg-red-800/30 hover:text-red-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-24rem)] overflow-y-auto text-gray-300 custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg transform hover:scale-[1.02] transition-transform">
                <h3
                  className="text-2xl text-red-400 mb-4 flex items-center gap-2"
                  style={{ fontFamily: 'BMEuljiro10yearslater' }}
                >
                  <Skull className="text-red-500" />
                  감염된 학교의 마지막 생존자들
                </h3>
                <p className="text-base leading-relaxed">
                  학교는 좀비 바이러스에 감염되었고, 소수의 학생들만이 남았습니다. 하지만 학생들
                  중에는 이미 감염된 자들이 숨어있습니다. 진정한 생존자들은 감염자들을 찾아내야
                  하고, 감염자들은 남은 생존자들을 감염시키려 합니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-900/50 rounded-lg">
                      <Users className="text-red-400 h-6 w-6" />
                    </div>
                    <span
                      className="text-xl text-red-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      추천 인원
                    </span>
                  </div>
                  <p className="text-lg ml-11">6-8명의 생존자</p>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-900/50 rounded-lg">
                      <Timer className="text-red-400 h-6 w-6" />
                    </div>
                    <span
                      className="text-xl text-red-400"
                      style={{ fontFamily: 'BMEuljiro10yearslater' }}
                    >
                      게임 시간
                    </span>
                  </div>
                  <p className="text-lg ml-11">약 15-20분</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="grid gap-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-900/50 rounded-lg">
                    <Skull className="text-red-400 h-6 w-6" />
                  </div>
                  <span
                    className="text-xl text-red-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    감염자
                  </span>
                </div>
                <p className="text-base ml-11">정체를 숨기고 다른 생존자들을 감염시켜야 합니다.</p>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-900/50 rounded-lg">
                    <Users className="text-blue-400 h-6 w-6" />
                  </div>
                  <span
                    className="text-xl text-blue-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    생존자
                  </span>
                </div>
                <p className="text-base ml-11">
                  감염자를 찾아내어 모든 위협으로부터 생존해야 합니다.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-900/50 rounded-lg">
                    <Shield className="text-yellow-400 h-6 w-6" />
                  </div>
                  <span
                    className="text-xl text-yellow-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    담임 선생님
                  </span>
                </div>
                <p className="text-base ml-11">
                  밤중에 다른 생존자의 감염 여부를 확인할 수 있습니다.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-900/50 rounded-lg">
                    <HeartPulse className="text-green-400 h-6 w-6" />
                  </div>
                  <span
                    className="text-xl text-green-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    보건 교사
                  </span>
                </div>
                <p className="text-base ml-11">
                  밤중에 한 명의 생존자에게 백신을 투여할 수 있습니다.
                  <p>*본인에게 두번 연속 투여 불가</p>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-900/50 rounded-lg">
                    <Sun className="text-yellow-400 h-6 w-6" />
                  </div>
                  <span
                    className="text-xl text-yellow-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    낮 시간
                  </span>
                </div>
                <ul className="space-y-2 ml-11 text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    생존자들이 모여 감염자를 찾기 위한 회의를 진행합니다.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    의심되는 생존자를 지목하여 투표를 진행합니다.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    과반수 이상의 투표를 받은 생존자는 격리됩니다.
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-900/50 rounded-lg">
                    <Moon className="text-blue-400 h-6 w-6" />
                  </div>
                  <span
                    className="text-xl text-blue-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    밤 시간
                  </span>
                </div>
                <ul className="space-y-2 ml-11 text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    감염자들은 한 명의 생존자를 감염시킵니다.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    담임 선생님은 한 명의 감염 여부를 확인합니다.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    보건 교사는 한 명의 생존자를 보호합니다.
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-red-800 shadow-lg hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-900/50 rounded-lg">
                    <Skull className="text-red-400 h-6 w-6" />
                  </div>
                  <span
                    className="text-xl text-red-400"
                    style={{ fontFamily: 'BMEuljiro10yearslater' }}
                  >
                    승리 조건
                  </span>
                </div>
                <ul className="space-y-2 ml-11 text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    생존자 승리: 모든 감염자를 찾아내어 격리
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    감염자 승리: 생존자의 수가 감염자의 수와 같아질 때
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-t border-red-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-900 to-red-800 text-red-100 rounded-lg 
                    hover:from-red-800 hover:to-red-700 transition-all duration-300 
                    transform hover:scale-[1.02] active:scale-95
                    shadow-lg hover:shadow-red-900/50"
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
