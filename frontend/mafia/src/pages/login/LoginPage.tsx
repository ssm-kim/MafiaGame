import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        let response;
        if (location.pathname === 'http://localhost:8080/api/login/success') {
          // 백엔드에 로그인 확인 요청 (쿠키 포함)
          response = await axios.get('http://localhost:8080/api/login/success', {
            withCredentials: true,
          });

          console.log('로그인 상태 확인 응답:', response.data);
        }
        if (response?.data?.isSuccess) {
          console.log('로그인 성공 → 게임 로비로 이동');
          navigate('/game-lobby', { replace: true });
        }
      } catch (error) {
        // console.error('로그인 확인 실패:', error);
        // navigate('/login', {
        //   state: { error: '로그인에 실패했습니다. 다시 시도해주세요.' },
        // });
      }
    };

    checkLoginStatus();
  }, [useNavigate, useLocation]);

  const handleKakaoLogin = () => {
    const KAKAO_AUTH_URL = `/oauth2/authorization/kakao`;
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/images/splash_background.jpg")' }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      <div className="max-w-md w-full space-y-8 bg-gray-900 bg-opacity-90 p-8 rounded-lg shadow-2xl border-2 border-gray-800 relative z-10">
        <div className="text-center">
          <h2
            className="text-4xl font-bold text-red-500 mb-2"
            style={{ fontFamily: 'BMEuljiro10yearslater' }}
          >
            생존자 로그인
          </h2>
          <p className="text-gray-400 text-sm">학교에 돌아오신 것을 환영합니다</p>
        </div>
        <div className="flex flex-col gap-3 mt-8">
          <button
            type="button"
            className="w-full py-3 bg-[#FEE500] text-black rounded-full font-medium text-sm hover:bg-[#FDD800] transition-colors duration-200"
            onClick={handleKakaoLogin}
          >
            Kakao로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
