import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';

interface RankingData {
  memberId: number;
  nickname: string;
  wins: number;
  totalGames: number;
  survivedGames: number;
  winRate: number;
}

function RankingPage() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [nickname, setNickname] = useState('');
  const [timeFrame, setTimeFrame] = useState<'all' | 'monthly' | 'weekly'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rankingsResponse, userResponse] = await Promise.all([
          api.get(`/api/rankings/${timeFrame}`),
          api.get('/api/member'),
        ]);

        if (rankingsResponse.data.isSuccess) {
          setRankings(rankingsResponse.data.result);
        }

        if (userResponse.data.isSuccess) {
          setNickname(userResponse.data.result.nickname);
        }
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      }
    };

    fetchData();
  }, [timeFrame]);

  const handleLogout = async () => {
    try {
      const response = await api.post('/api/logout');
      if (response.data.isSuccess) {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Failed to logout:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBackToLobby = () => {
    navigate('/lobby');
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-2 sm:p-4"
      style={{
        backgroundImage: 'url("/images/splash_background.jpg")',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      <div className="fixed inset-0 bg-black bg-opacity-90" />
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 상단 버튼 */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBackToLobby}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-red-900 bg-opacity-90 text-red-300 text-xs sm:text-sm rounded-md 
              hover:bg-red-800 transition-all duration-300 border-2 border-red-700 
              hover:border-red-500 shadow-lg hover:shadow-red-900/50 animate-pulse"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            ← 대피소로 긴급 대피
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 bg-opacity-90 text-gray-300 text-xs sm:text-sm rounded-md 
              hover:bg-gray-800 transition-all duration-300 border-2 border-gray-700 
              hover:border-gray-500 shadow-lg hover:shadow-gray-900/50"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            최종 탈출
          </button>
        </div>

        {/* 우측 상단 유저 정보 */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <div
            className="text-red-300 px-4 sm:px-6 py-2 sm:py-3 bg-red-900 bg-opacity-70 rounded-md 
            border-2 border-red-700 shadow-lg shadow-red-900/50 animate-pulse"
          >
            <span
              className="flex items-center gap-2 text-xs sm:text-sm"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="animate-pulse">{nickname}</span>
              <span className="text-red-400">| 생존 확인됨</span>
            </span>
          </div>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-8 sm:mb-16 pt-16 sm:pt-20">
          <div className="relative">
            <h1
              className="text-xl sm:text-3xl md:text-4xl text-red-500 mb-2 animate-pulse"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              【 생존자 명예의 전당 】
            </h1>
            <p
              className="text-sm sm:text-base text-red-400 animate-fade-in"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              ※ 경고: 마지막까지 살아남은 자들의 기록 ※
            </p>
          </div>
        </div>

        {/* 기간 선택 버튼 */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { key: 'all' as const, label: '전체 생존 기록' },
            { key: 'monthly' as const, label: '이번 달 생존자' },
            { key: 'weekly' as const, label: '금주 생존자' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeFrame(key)}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${
                timeFrame === key
                  ? 'bg-red-900 text-red-300 border-2 border-red-700 animate-pulse'
                  : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:bg-gray-700'
              }`}
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 랭킹 테이블 */}
        <div className="bg-black bg-opacity-80 rounded-lg border-2 border-red-900 p-4 mx-2 sm:mx-0 shadow-lg shadow-red-900/30">
          <table className="w-full">
            <thead>
              <tr className="text-red-500 border-b-2 border-red-900">
                <th className="px-2 py-3 text-left">생존 순위</th>
                <th className="px-2 py-3 text-left">생존자명</th>
                <th className="px-2 py-3 text-right">생존 승리</th>
                <th className="px-2 py-3 text-right hidden sm:table-cell">감염 시도</th>
                <th className="px-2 py-3 text-right hidden sm:table-cell">생존 횟수</th>
                <th className="px-2 py-3 text-right">생존률</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((rank, index) => (
                <tr
                  key={rank.memberId}
                  className="text-gray-300 border-b border-red-900/30 hover:bg-red-900/20 transition-colors"
                >
                  <td className="px-2 py-3">
                    <span
                      className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full
                      ${
                        index === 0
                          ? 'bg-yellow-500 text-black animate-pulse'
                          : index === 1
                            ? 'bg-gray-400 text-black'
                            : index === 2
                              ? 'bg-yellow-700 text-black'
                              : ''
                      }
                    `}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3 font-bold">{rank.nickname}</td>
                  <td className="px-2 py-3 text-right text-green-400">{rank.wins}</td>
                  <td className="px-2 py-3 text-right hidden sm:table-cell text-red-400">
                    {rank.totalGames}
                  </td>
                  <td className="px-2 py-3 text-right hidden sm:table-cell text-yellow-400">
                    {rank.survivedGames}
                  </td>
                  <td className="px-2 py-3 text-right font-bold text-green-400">
                    {rank.winRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 경고 메시지 */}
        <div
          className="mt-8 text-red-500 text-xs sm:text-sm text-center animate-pulse"
          style={{ fontFamily: 'BMEuljiro10yearslater' }}
        >
          !!! 경고: 당신의 이름이 이곳에 새겨질 때까지... 살아남으십시오 !!!
        </div>
      </div>
    </div>
  );
}

export default RankingPage;
