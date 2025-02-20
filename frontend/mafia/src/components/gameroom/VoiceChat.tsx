import { useEffect, useState, useRef, useCallback } from 'react';
import {
  OpenVidu,
  Publisher,
  Session,
  StreamManager,
  Subscriber,
  PublisherProperties,
} from 'openvidu-browser';

interface VoiceChatProps {
  roomId: string | number;
  participantNo: number | null;
  nickname: string;
  gameState: {
    roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED' | null;
    isNight?: boolean;
    myInfo?: {
      playerNo: number;
      nickname: string;
      subscriptions: string[];
      isDead: boolean;
      role: string;
      muteAudio: boolean;
      muteMic: boolean;
      openviduToken: string;
    };
    participant: Record<
      string,
      {
        isDead?: boolean;
        role?: string;
      }
    >;
  } | null;
}

function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const audioElements = useRef<Record<string, HTMLAudioElement>>({});
  const audioAnalyserInterval = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  // 게임 규칙에 따른 권한 체크
  const canSpeak = useCallback(() => {
    if (!gameState?.myInfo) return false;

    if (gameState.myInfo.isDead) return false;
    if (gameState.isNight && gameState.myInfo.role !== 'ZOMBIE') return false;
    if (gameState.myInfo.muteMic) return false;

    return true;
  }, [gameState?.myInfo, gameState?.isNight]);

  // 특정 스트림을 구독할 수 있는지 체크
  const canSubscribeToStream = useCallback(
    (streamRole?: string) => {
      if (!gameState?.myInfo) return false;

      if (gameState.myInfo.isDead) return true;
      if (!gameState.isNight) return true;
      if (gameState.isNight) {
        if (gameState.myInfo.role === 'ZOMBIE' && streamRole === 'ZOMBIE') {
          return true;
        }
        return false;
      }

      return true;
    },
    [gameState?.myInfo, gameState?.isNight],
  );

  // 사용 가능한 마이크 목록 가져오기
  const getAvailableMicrophones = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter((device) => device.kind === 'audioinput');
      setAvailableMicrophones(audioDevices);
      // console.log('Available Microphones:', audioDevices);
      return audioDevices;
    } catch (error) {
      console.error('Error getting audio devices:', error);
      return [];
    }
  };

  // 오디오 레벨 모니터링 시작
  const startAudioLevelMonitoring = (mediaStream: MediaStream) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }

      const analyser = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      if (audioAnalyserInterval.current) {
        clearInterval(audioAnalyserInterval.current);
      }

      audioAnalyserInterval.current = window.setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const audioLevel = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        if (audioLevel > 0) {
          // console.log('Current Audio Level:', audioLevel.toFixed(2));
        }
      }, 1000) as unknown as number;
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
    }
  };

  // 오디오 엘리먼트 생성
  const createAudioElement = (streamManager: StreamManager) => {
    try {
      // 이미 존재하는 오디오 엘리먼트가 있다면 제거
      const existingAudio = document.getElementById(`audio-${streamManager.stream.streamId}`);
      if (existingAudio) {
        existingAudio.remove();
      }

      const audioElement = document.createElement('audio');
      const mediaStream = streamManager.stream.getMediaStream();
      audioElement.srcObject = mediaStream;
      audioElement.id = `audio-${streamManager.stream.streamId}`;
      audioElement.autoplay = true;
      audioElement.setAttribute('playsinline', 'true');
      audioElement.volume = 1.0;

      document.body.appendChild(audioElement);
      audioElements.current[streamManager.stream.streamId] = audioElement;

      // console.log('Audio element created for:', {
      //   streamId: streamManager.stream.streamId,
      //   isPublisher: streamManager === publisher,
      //   audioTracks: mediaStream.getAudioTracks().length,
      //   trackInfo: mediaStream.getAudioTracks().map((track) => ({
      //     enabled: track.enabled,
      //     muted: track.muted,
      //     readyState: track.readyState,
      //     label: track.label,
      //   })),
      // });

      // 오디오 상태 모니터링
      audioElement.onloadedmetadata = () => {
        console.log('Audio metadata loaded:', streamManager.stream.streamId);
      };

      audioElement.onplay = () =>
        console.log('Audio started playing:', streamManager.stream.streamId);
      audioElement.onplaying = () => {
        console.log('Audio is actually playing:', streamManager.stream.streamId);
      };
      audioElement.onpause = () => console.log('Audio paused:', streamManager.stream.streamId);
      audioElement.onerror = (e) => console.error('Audio error:', e);

      // 실제로 오디오가 재생되는지 확인
      audioElement.oncanplay = () => {
        console.log('Audio can play:', streamManager.stream.streamId);
        audioElement
          .play()
          .then(() => console.log('Audio playback started'))
          .catch((err) => console.error('Audio playback failed:', err));
      };
    } catch (error) {
      console.error('Error creating audio element:', error);
    }
  };

  useEffect(() => {
    if (gameState?.roomStatus === 'PLAYING' && participantNo !== null && gameState.myInfo) {
      const initializeVoiceChat = async () => {
        if (!gameState.myInfo) return;

        try {
          const audioDevices = await getAvailableMicrophones();

          const defaultMic = audioDevices.find(
            (device) =>
              device.label.toLowerCase().includes('default') ||
              device.label.toLowerCase().includes('built-in') ||
              device.label.toLowerCase().includes('internal'),
          );

          console.log('Selected microphone:', defaultMic);

          const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: defaultMic
              ? {
                  deviceId: { exact: defaultMic.deviceId },
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                }
              : true,
          });

          // console.log('MediaStream obtained:', mediaStream.getAudioTracks());
          startAudioLevelMonitoring(mediaStream);

          const OV = new OpenVidu();
          OV.enableProdMode();

          const token = gameState.myInfo.openviduToken;
          if (!token) {
            throw new Error('OpenVidu token not found');
          }

          const session = OV.initSession();

          session.on('streamCreated', async (event) => {
            try {
              const connectionData = event.stream.connection.data;
              // console.log('Raw connection data:', connectionData);

              let streamData;
              if (typeof connectionData === 'string') {
                const [jsonPart] = connectionData.split('%/%');
                try {
                  streamData = JSON.parse(jsonPart);
                  // console.log('Parsed stream data:', {
                  //   streamData,
                  //   role: streamData.role,
                  //   nickname: streamData.clientData,
                  // });
                } catch (parseError) {
                  console.log('JSON parse failed, using fallback:', parseError);
                  streamData = { clientData: connectionData };
                }
              } else {
                streamData = { clientData: connectionData };
              }

              // subscriber 생성 확인
              if (canSubscribeToStream(streamData.role)) {
                // console.log('Creating subscriber for:', streamData);
                const subscriber = await session.subscribe(event.stream, undefined);
                console.log('Subscriber created:', subscriber);
                await new Promise((resolve) => setTimeout(resolve, 500)); // 오디오 트랙이 준비될 때까지 잠시 대기
                setSubscribers((prev) => [...prev, subscriber]);
                createAudioElement(subscriber);
              } else {
                // console.log('Stream subscription blocked. Stream data:', streamData);
              }
            } catch (error) {
              // console.log('Stream handling error:', error);
              const subscriber = await session.subscribe(event.stream, undefined);
              await new Promise((resolve) => setTimeout(resolve, 500));
              setSubscribers((prev) => [...prev, subscriber]);
              createAudioElement(subscriber);
            }
          });

          session.on('streamDestroyed', (event) => {
            const subscriber = subscribers.find(
              (sub) => sub.stream.streamManager === event.stream.streamManager,
            );
            if (subscriber) {
              const audioElement = audioElements.current[event.stream.streamId];
              if (audioElement) {
                audioElement.remove();
                delete audioElements.current[event.stream.streamId];
              }
              session.unsubscribe(subscriber);
              setSubscribers((prev) => prev.filter((sub) => sub !== subscriber));
            }
          });

          await session.connect(token, {
            clientData: JSON.stringify({
              nickname,
              role: gameState.myInfo.role,
              isDead: gameState.myInfo.isDead,
            }),
          });

          console.log('Session connected');

          if (canSpeak()) {
            // console.log('Initializing publisher...');
            const publisherProperties: PublisherProperties = {
              audioSource: defaultMic?.deviceId || undefined,
              videoSource: false,
              publishAudio: true,
              publishVideo: false,
              mirror: false,
            };

            const publisher = await OV.initPublisher(undefined, publisherProperties);
            await session.publish(publisher);

            console.log('Publisher created:', {
              streamId: publisher.stream?.streamId,
              audioActive: publisher.stream?.audioActive,
            });

            setPublisher(publisher);
            setIsMuted(false);
          }

          setSession(session);
        } catch (error) {
          console.error('Voice chat initialization error:', error);
        }
      };

      initializeVoiceChat();
    }

    return () => {
      // console.log('Cleaning up voice chat...');
      // if (audioAnalyserInterval.current) {
      //   clearInterval(audioAnalyserInterval.current);
      // }
      // if (audioContext.current) {
      //   audioContext.current.close();
      // }
      // if (session) {
      //   try {
      //     // console.log('Cleaning up audio elements:', Object.keys(audioElements.current));
      //     Object.values(audioElements.current).forEach((audio) => audio.remove());
      //     audioElements.current = {};
      //     if (publisher) {
      //       session.unpublish(publisher);
      //     }
      //     session.disconnect();
      //     setSession(null);
      //     setPublisher(null);
      //     setSubscribers([]);
      //     console.log('Clean up voice chat...');
      //   } catch (error) {
      //     console.error('Cleanup error:', error);
      //   }
      // }
    };
  }, [
    roomId,
    participantNo,
    nickname,
    gameState?.roomStatus,
    gameState?.myInfo,
    gameState?.isNight,
    canSpeak,
    canSubscribeToStream,
    subscribers,
    session,
    publisher,
  ]);

  useEffect(() => {
    if (publisher && gameState?.myInfo) {
      if (!canSpeak()) {
        session?.unpublish(publisher);
        setPublisher(null);
        setIsMuted(true);
      }
    }
  }, [gameState?.myInfo, publisher, session, canSpeak]);

  // 새로 추가: isMuted 상태가 변경될 때마다 실제 오디오 상태 동기화
  useEffect(() => {
    if (publisher && canSpeak()) {
      try {
        publisher.publishAudio(!isMuted);
        // console.log('Audio state synchronized:', {
        //   isMuted,
        //   audioActive: publisher.stream?.audioActive,
        // });
      } catch (error) {
        console.error('Error synchronizing audio state:', error);
      }
    }
  }, [isMuted, publisher, canSpeak]);

  const toggleMute = useCallback(() => {
    if (publisher && canSpeak()) {
      try {
        const newMuteState = !isMuted;
        publisher.publishAudio(!newMuteState);
        setIsMuted(newMuteState);

        console.log('Mute toggled:', {
          newState: newMuteState,
          audioActive: publisher.stream?.audioActive,
        });
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  }, [publisher, canSpeak, isMuted]);

  if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
    return null;
  }

  if (!canSpeak()) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <div style={{ display: 'none' }}>
        {subscribers.map((sub) => {
          console.log('Rendering subscriber audio:', sub.stream.streamId);
          return (
            <audio
              key={sub.stream.streamId}
              id={`audio-${sub.stream.streamId}`}
              autoPlay
              playsInline
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggleMute}
        className={`p-2 rounded-full ${
          isMuted
            ? 'bg-red-900 border-2 border-red-600'
            : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'
        } text-white transition-all duration-200 shadow-lg`}
        title={isMuted ? '음소거 해제' : '음소거'}
      >
        {isMuted ? '🔇' : '🎤'}
      </button>

      {availableMicrophones.length > 0 && (
        <div className="absolute bottom-full mb-2 right-0 p-2 bg-gray-800 rounded-lg border border-gray-600">
          <select
            className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
            onChange={async (e) => {
              if (publisher) {
                try {
                  const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                      deviceId: { exact: e.target.value },
                      echoCancellation: true,
                      noiseSuppression: true,
                      autoGainControl: true,
                    },
                  });
                  publisher.replaceTrack(newStream.getAudioTracks()[0]);
                  startAudioLevelMonitoring(newStream);
                } catch (error) {
                  console.error('Error switching microphone:', error);
                }
              }
            }}
          >
            {availableMicrophones.map((device) => (
              <option
                key={device.deviceId}
                value={device.deviceId}
              >
                {device.label || `Microphone ${device.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default VoiceChat;
