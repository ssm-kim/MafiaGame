import { useEffect, useRef } from 'react';

function AudioComponent({ streamManager }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addAudioElement(audioRef.current);
    }
  }, [streamManager]); // streamManager가 변경될 때만 실행됨

  return (
    <audio
      autoPlay
      ref={audioRef}
    />
  );
}

export default AudioComponent;
