import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function BGMPlayer(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    // 게임룸이 아닌 경우에만 BGM 재생
    // console.log('Current path:', location.pathname);
    const shouldPlayBGM = !location.pathname.startsWith('/game/');
    // console.log('Should play BGM:', shouldPlayBGM);
    if (shouldPlayBGM) {
      if (audioRef.current) {
        audioRef.current.src = '/bgm/background-bgm.mp3';
        audioRef.current.loop = true;

        // 자동 재생
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Auto-play was prevented:', error);
          });
        }
      }
    } else {
      // 게임룸에서는 BGM 중지
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    // 컴포넌트 언마운트 시 오디오 정리
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [location]);

  return (
    <audio
      ref={audioRef}
      preload="auto"
    />
  );
}

export default BGMPlayer;
