import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Splash() {
  const navigate = useNavigate();
  const [flicker, setFlicker] = useState(false);
  const [textGlitch, setTextGlitch] = useState(false);
  const [distortion, setDistortion] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 4000);

    const flickerInterval = setInterval(
      () => {
        setFlicker((prev) => !prev);
      },
      Math.random() * 200 + 300,
    );

    // 텍스트 글리치 효과 - 더 자주, 더 강하게
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.1) {
        setTextGlitch(true);
        setDistortion(Math.random() > 0.5); // 50% 확률로 왜곡 효과 추가
        setTimeout(() => {
          setTextGlitch(false);
          setDistortion(false);
        }, 150);
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearInterval(flickerInterval);
      clearInterval(glitchInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* 배경 이미지 컨테이너 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 줌 효과가 적용된 실제 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-100"
          style={{
            backgroundImage: 'url("/images/splash_background.jpg")',
            transform: 'scale(1.2)',
            animation: 'zoom-out 20s linear infinite',
          }}
        />
      </div>

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      {/* 깜빡이는 빨간색 비네트 효과 */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-red-900/30 to-transparent
        ${flicker ? 'opacity-40' : 'opacity-0'} transition-opacity duration-75`}
      />

      {/* 깜빡이는 빨간색 오버레이 */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent
        ${flicker ? 'opacity-20' : 'opacity-0'} transition-opacity duration-75`}
      />

      {/* 메인 컨텐츠 */}
      <div className="text-center relative z-10">
        <div className="relative">
          {/* 왜곡된 텍스트 효과 */}
          {distortion && (
            <h1
              className="text-9xl font-bold text-red-600/30 absolute top-0 left-0 w-full"
              style={{
                fontFamily: 'BMEuljiro10yearslater',
                transform: 'scale(1.02, 1.05) translate(2px, -2px)',
                filter: 'blur(2px)',
              }}
            >
              지금 우리 학교는
            </h1>
          )}

          {/* 글리치 효과 레이어 1 */}
          <h1
            className={`text-9xl font-bold text-white/90 absolute top-0 left-0 w-full
              ${textGlitch ? 'translate-x-2 skew-x-2' : ''}`}
            style={{
              fontFamily: 'BMEuljiro10yearslater',
              clipPath: textGlitch ? 'inset(0 0 50% 0)' : 'none',
              filter: textGlitch ? 'blur(1px)' : 'none',
            }}
          >
            지금 우리 학교는
          </h1>

          {/* 글리치 효과 레이어 2 */}
          <h1
            className={`text-9xl font-bold text-white/90 absolute top-0 left-0 w-full
              ${textGlitch ? '-translate-x-2 -skew-x-2' : ''}`}
            style={{
              fontFamily: 'BMEuljiro10yearslater',
              clipPath: textGlitch ? 'inset(50% 0 0 0)' : 'none',
              filter: textGlitch ? 'blur(1px)' : 'none',
            }}
          >
            지금 우리 학교는
          </h1>

          {/* 메인 텍스트 */}
          <h1
            className={`text-9xl font-bold ${
              flicker ? 'text-red-50/90' : 'text-white/90'
            } transition-colors duration-155`}
            style={{
              fontFamily: 'BMEuljiro10yearslater',
              opacity: textGlitch ? 0 : 1,
            }}
          >
            지금 우리 학교는
          </h1>
        </div>
      </div>

      <style>{`
        @keyframes zoom-out {
          0% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        @keyframes text-shadow {
          0% {
            text-shadow: none;
          }
          10% {
            text-shadow: 3px 3px 0 red;
          }
          20% {
            text-shadow: 3px 3px 0 red, 6px 6px 0 red;
          }
          30% {
            text-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Splash;
