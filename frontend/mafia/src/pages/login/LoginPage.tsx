import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [flicker] = useState(false);
  const [textGlitch] = useState(false);

  useEffect(() => {
    (async () => {
      if (location.pathname === '/login/success') {
        try {
          const response = await axios.get('/api/login/success', {
            withCredentials: true,
          });

          if (response.data.isSuccess) {
            const memberResponse = await axios.get('/api/member', {
              withCredentials: true,
            });

            if (memberResponse.data.isSuccess) {
              localStorage.setItem('memberId', memberResponse.data.result.id);
              localStorage.setItem('username', memberResponse.data.result.nickname);
            }

            navigate('/game-lobby', { replace: true });
          }
        } catch (error) {
          console.error('로그인 확인 실패:', error);
          navigate('/login', {
            state: { error: '로그인에 실패했습니다. 다시 시도해주세요.' },
          });
        }
      }
    })();
  }, [location, navigate]);

  const handleGuestLogin = async () => {
    try {
      const response = await axios.post(
        '/api/login/guest',
        {},
        {
          withCredentials: true,
        },
      );

      if (response.data.isSuccess) {
        localStorage.setItem('memberId', response.data.result.memberId);
        localStorage.setItem('username', response.data.result.nickname);
        navigate('/game-lobby', { replace: true });
      }
    } catch (error) {
      console.error('게스트 로그인 실패:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleKakaoLogin = () => {
    const KAKAO_AUTH_URL = `/oauth2/authorization/kakao`;
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: 'url("/images/splash_background.jpg")',
            animation: 'zoom-out 30s linear infinite',
          }}
        />
      </div>

      <div className="absolute inset-0 bg-black bg-opacity-60" />

      <div
        className={`absolute inset-0 bg-gradient-to-r to-transparent
       transition-opacity duration-200`}
      />

      <div className="max-w-md w-full relative z-10">
        <div className="relative bg-gray-900 bg-opacity-90 p-8 rounded-lg shadow-2xl border-2 border-gray-800">
          <div className="text-center relative">
            <h2
              className="text-4xl font-bold text-red-600 mb-2"
              style={{
                fontFamily: 'BMEuljiro10yearslater',
              }}
            >
              생존자 로그인
            </h2>
            <p className={`text-gray-400 text-sm ${textGlitch ? '-translate-x-[1px]' : ''}`}>
              학교에 돌아오신 것을 환영합니다
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleGuestLogin}
              className="w-full py-3 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors duration-200"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              게스트로 시작하기
            </button>

            <button
              type="button"
              onClick={handleKakaoLogin}
              className={`w-full py-3 bg-[#FEE500] text-black font-medium rounded
               hover:bg-[#FDD800] transition-all duration-200 flex items-center justify-center gap-2`}
              style={{
                boxShadow: flicker ? '0 0 8px rgba(255, 0, 0, 0.2)' : 'none',
                fontFamily: 'BMEuljiro10yearslater',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
              >
                <path
                  fill="#000000"
                  d="M9 0.5C4.03125 0.5 0 3.75 0 7.78125C0 10.3438 1.625 12.5938 4.09375 13.9375L3.0625 17.2188C3 17.4375 3.125 17.6875 3.34375 17.7812C3.4375 17.8125 3.53125 17.8438 3.625 17.8438C3.78125 17.8438 3.90625 17.7812 4 17.6875L7.90625 15.0625C8.25 15.0938 8.625 15.125 9 15.125C13.9688 15.125 18 11.875 18 7.84375C18 3.75 13.9688 0.5 9 0.5Z"
                />
              </svg>
              Kakao로 시작하기
            </button>
          </div>
        </div>
      </div>

      <style>{`
       @keyframes zoom-out {
         0% { transform: scale(1.1); }
         100% { transform: scale(1); }
       }
     `}</style>
    </div>
  );
}

export default LoginPage;
