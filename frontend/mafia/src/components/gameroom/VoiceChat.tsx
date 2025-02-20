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
      console.log('Available Microphones:', audioDevices);
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
          console.log('Current Audio Level:', audioLevel.toFixed(2));
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

      console.log('Audio element created for:', {
        streamId: streamManager.stream.streamId,
        isPublisher: streamManager === publisher,
        audioTracks: mediaStream.getAudioTracks().length,
        trackInfo: mediaStream.getAudioTracks().map((track) => ({
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label,
        })),
      });

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

          console.log('MediaStream obtained:', mediaStream.getAudioTracks());
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
              console.log('Raw connection data:', connectionData);

              let streamData;
              if (typeof connectionData === 'string') {
                const [jsonPart] = connectionData.split('%/%');
                try {
                  streamData = JSON.parse(jsonPart);
                  console.log('Parsed stream data:', {
                    streamData,
                    role: streamData.role,
                    nickname: streamData.clientData,
                  });
                } catch (parseError) {
                  console.log('JSON parse failed, using fallback:', parseError);
                  streamData = { clientData: connectionData };
                }
              } else {
                streamData = { clientData: connectionData };
              }

              // subscriber 생성 확인
              if (canSubscribeToStream(streamData.role)) {
                console.log('Creating subscriber for:', streamData);
                const subscriber = await session.subscribe(event.stream, undefined);
                console.log('Subscriber created:', subscriber);
                await new Promise((resolve) => setTimeout(resolve, 500)); // 오디오 트랙이 준비될 때까지 잠시 대기
                setSubscribers((prev) => [...prev, subscriber]);
                createAudioElement(subscriber);
              } else {
                console.log('Stream subscription blocked. Stream data:', streamData);
              }
            } catch (error) {
              console.log('Stream handling error:', error);
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
            console.log('Initializing publisher...');
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
      console.log('Cleaning up voice chat...');
      if (audioAnalyserInterval.current) {
        clearInterval(audioAnalyserInterval.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
      if (session) {
        try {
          console.log('Cleaning up audio elements:', Object.keys(audioElements.current));
          Object.values(audioElements.current).forEach((audio) => audio.remove());
          audioElements.current = {};

          if (publisher) {
            session.unpublish(publisher);
          }
          session.disconnect();
          setSession(null);
          setPublisher(null);
          setSubscribers([]);
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }
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
        console.log('Audio state synchronized:', {
          isMuted,
          audioActive: publisher.stream?.audioActive,
        });
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

// import { useEffect, useState, useRef, useCallback } from 'react';
// import {
//   OpenVidu,
//   Publisher,
//   Session,
//   StreamManager,
//   Subscriber,
//   PublisherProperties,
// } from 'openvidu-browser';

// interface VoiceChatProps {
//   roomId: string | number;
//   participantNo: number | null;
//   nickname: string;
//   gameState: {
//     roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED' | null;
//     isNight?: boolean;
//     myInfo?: {
//       playerNo: number;
//       nickname: string;
//       subscriptions: string[];
//       isDead: boolean;
//       role: string;
//       muteAudio: boolean;
//       muteMic: boolean;
//       openviduToken: string;
//     };
//     participant: Record<
//       string,
//       {
//         isDead?: boolean;
//         role?: string;
//       }
//     >;
//   } | null;
// }

// function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
//   const [session, setSession] = useState<Session | null>(null);
//   const [publisher, setPublisher] = useState<Publisher | null>(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
//   const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
//   const audioElements = useRef<Record<string, HTMLAudioElement>>({});
//   const audioAnalyserInterval = useRef<number | null>(null);
//   const audioContext = useRef<AudioContext | null>(null);

//   // 게임 규칙에 따른 권한 체크
//   const canSpeak = useCallback(() => {
//     if (!gameState?.myInfo) return false;

//     if (gameState.myInfo.isDead) return false;
//     if (gameState.isNight && gameState.myInfo.role !== 'ZOMBIE') return false;
//     if (gameState.myInfo.muteMic) return false;

//     return true;
//   }, [gameState?.myInfo, gameState?.isNight]);

//   // 특정 스트림을 구독할 수 있는지 체크
//   const canSubscribeToStream = useCallback(
//     (streamRole?: string) => {
//       if (!gameState?.myInfo) return false;

//       if (gameState.myInfo.isDead) return true;
//       if (!gameState.isNight) return true;
//       if (gameState.isNight) {
//         if (gameState.myInfo.role === 'ZOMBIE' && streamRole === 'ZOMBIE') {
//           return true;
//         }
//         return false;
//       }

//       return true;
//     },
//     [gameState?.myInfo, gameState?.isNight],
//   );

//   // 사용 가능한 마이크 목록 가져오기
//   const getAvailableMicrophones = async () => {
//     try {
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const audioDevices = devices.filter((device) => device.kind === 'audioinput');
//       setAvailableMicrophones(audioDevices);
//       console.log('Available Microphones:', audioDevices);
//       return audioDevices;
//     } catch (error) {
//       console.error('Error getting audio devices:', error);
//       return [];
//     }
//   };

//   // 오디오 레벨 모니터링 시작
//   const startAudioLevelMonitoring = (mediaStream: MediaStream) => {
//     try {
//       if (!audioContext.current) {
//         audioContext.current = new AudioContext();
//       }

//       const analyser = audioContext.current.createAnalyser();
//       const source = audioContext.current.createMediaStreamSource(mediaStream);
//       source.connect(analyser);
//       analyser.fftSize = 256;

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);

//       if (audioAnalyserInterval.current) {
//         clearInterval(audioAnalyserInterval.current);
//       }

//       audioAnalyserInterval.current = window.setInterval(() => {
//         analyser.getByteFrequencyData(dataArray);
//         const audioLevel = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
//         if (audioLevel > 0) {
//           console.log('Current Audio Level:', audioLevel.toFixed(2));
//         }
//       }, 1000) as unknown as number;
//     } catch (error) {
//       console.error('Error setting up audio monitoring:', error);
//     }
//   };

//   // 오디오 엘리먼트 생성
//   const createAudioElement = (streamManager: StreamManager) => {
//     try {
//       // 이미 존재하는 오디오 엘리먼트가 있다면 제거
//       const existingAudio = document.getElementById(`audio-${streamManager.stream.streamId}`);
//       if (existingAudio) {
//         existingAudio.remove();
//       }

//       const audioElement = document.createElement('audio');
//       const mediaStream = streamManager.stream.getMediaStream();
//       audioElement.srcObject = mediaStream;
//       audioElement.id = `audio-${streamManager.stream.streamId}`;
//       audioElement.autoplay = true;
//       audioElement.setAttribute('playsinline', 'true');
//       audioElement.volume = 1.0;

//       document.body.appendChild(audioElement);
//       audioElements.current[streamManager.stream.streamId] = audioElement;

//       console.log('Audio element created for:', {
//         streamId: streamManager.stream.streamId,
//         isPublisher: streamManager === publisher,
//         audioTracks: mediaStream.getAudioTracks().length,
//         trackInfo: mediaStream.getAudioTracks().map((track) => ({
//           enabled: track.enabled,
//           muted: track.muted,
//           readyState: track.readyState,
//           label: track.label,
//         })),
//       });

//       // 오디오 상태 모니터링
//       audioElement.onplay = () =>
//         console.log('Audio started playing:', streamManager.stream.streamId);
//       audioElement.onpause = () => console.log('Audio paused:', streamManager.stream.streamId);
//       audioElement.onerror = (e) => console.error('Audio error:', e);

//       // 실제로 오디오가 재생되는지 확인
//       audioElement.oncanplay = () => {
//         console.log('Audio can play:', streamManager.stream.streamId);
//         audioElement
//           .play()
//           .then(() => console.log('Audio playback started'))
//           .catch((err) => console.error('Audio playback failed:', err));
//       };
//     } catch (error) {
//       console.error('Error creating audio element:', error);
//     }
//   };

//   useEffect(() => {
//     if (gameState?.roomStatus === 'PLAYING' && participantNo !== null && gameState.myInfo) {
//       const initializeVoiceChat = async () => {
//         if (!gameState.myInfo) return;

//         try {
//           const audioDevices = await getAvailableMicrophones();

//           const defaultMic = audioDevices.find(
//             (device) =>
//               device.label.toLowerCase().includes('default') ||
//               device.label.toLowerCase().includes('built-in') ||
//               device.label.toLowerCase().includes('internal'),
//           );

//           console.log('Selected microphone:', defaultMic);

//           const mediaStream = await navigator.mediaDevices.getUserMedia({
//             audio: defaultMic
//               ? {
//                   deviceId: { exact: defaultMic.deviceId },
//                   echoCancellation: true,
//                   noiseSuppression: true,
//                   autoGainControl: true,
//                 }
//               : true,
//           });

//           console.log('MediaStream obtained:', mediaStream.getAudioTracks());
//           startAudioLevelMonitoring(mediaStream);

//           const OV = new OpenVidu();
//           OV.enableProdMode();

//           const token = gameState.myInfo.openviduToken;
//           if (!token) {
//             throw new Error('OpenVidu token not found');
//           }

//           const session = OV.initSession();

//           // await걸어놓고
//           session.on('streamCreated', async (event) => {
//             try {
//               const connectionData = event.stream.connection.data;
//               console.log('Raw connection data:', connectionData);

//               let streamData;
//               if (typeof connectionData === 'string') {
//                 const [jsonPart] = connectionData.split('%/%');
//                 try {
//                   streamData = JSON.parse(jsonPart);
//                   console.log('Parsed stream data:', {
//                     streamData,
//                     role: streamData.role,
//                     nickname: streamData.clientData,
//                   });
//                 } catch (parseError) {
//                   console.log('JSON parse failed, using fallback:', parseError);
//                   streamData = { clientData: connectionData };
//                 }
//               } else {
//                 streamData = { clientData: connectionData };
//               }

//               // subscriber 생성 확인
//               if (canSubscribeToStream(streamData.role)) {
//                 console.log('Creating subscriber for:', streamData);
//                 const subscriber = await session.subscribe(event.stream, undefined);
//                 console.log('Subscriber created:', subscriber);
//                 await new Promise((resolve) => setTimeout(resolve, 500)); // 오디오 트랙이 준비될 때까지 잠시 대기
//                 setSubscribers((prev) => [...prev, subscriber]);
//                 createAudioElement(subscriber);
//               } else {
//                 console.log('Stream subscription blocked. Stream data:', streamData);
//               }
//             } catch (error) {
//               console.log('Stream handling error:', error);
//               const subscriber = await session.subscribe(event.stream, undefined);
//               await new Promise((resolve) => setTimeout(resolve, 500));
//               setSubscribers((prev) => [...prev, subscriber]);
//               createAudioElement(subscriber);
//             }
//           });

//           session.on('streamDestroyed', (event) => {
//             console.log('Stream destroyed:', event.stream.streamId);
//             const audioElement = audioElements.current[event.stream.streamId];
//             if (audioElement) {
//               audioElement.remove();
//               delete audioElements.current[event.stream.streamId];
//             }
//             setSubscribers((prev) =>
//               prev.filter((sub) => sub.stream.streamId !== event.stream.streamId),
//             );
//           });

//           await session.connect(token, {
//             clientData: JSON.stringify({
//               nickname,
//               role: gameState.myInfo.role,
//               isDead: gameState.myInfo.isDead,
//             }),
//           });

//           console.log('Session connected');

//           if (canSpeak()) {
//             console.log('Initializing publisher...');
//             const publisherProperties: PublisherProperties = {
//               audioSource: defaultMic?.deviceId || undefined,
//               videoSource: false,
//               publishAudio: true,
//               publishVideo: false,
//               mirror: false,
//             };

//             const publisher = await OV.initPublisher(undefined, publisherProperties);
//             await session.publish(publisher);

//             console.log('Publisher created:', {
//               streamId: publisher.stream?.streamId,
//               audioActive: publisher.stream?.audioActive,
//             });

//             setPublisher(publisher);
//             setIsMuted(false);
//           }

//           setSession(session);
//         } catch (error) {
//           console.error('Voice chat initialization error:', error);
//         }
//       };

//       initializeVoiceChat();
//     }

//     return () => {
//       console.log('Cleaning up voice chat...');
//       if (audioAnalyserInterval.current) {
//         clearInterval(audioAnalyserInterval.current);
//       }
//       if (audioContext.current) {
//         audioContext.current.close();
//       }
//       if (session) {
//         try {
//           console.log('Cleaning up audio elements:', Object.keys(audioElements.current));
//           Object.values(audioElements.current).forEach((audio) => audio.remove());
//           audioElements.current = {};

//           if (publisher) {
//             session.unpublish(publisher);
//           }
//           session.disconnect();
//           setSession(null);
//           setPublisher(null);
//           setSubscribers([]);
//         } catch (error) {
//           console.error('Cleanup error:', error);
//         }
//       }
//     };
//   }, [
//     roomId,
//     participantNo,
//     nickname,
//     gameState?.roomStatus,
//     gameState?.myInfo,
//     gameState?.isNight,
//     canSpeak,
//     canSubscribeToStream,
//   ]);

//   useEffect(() => {
//     if (publisher && gameState?.myInfo) {
//       if (!canSpeak()) {
//         session?.unpublish(publisher);
//         setPublisher(null);
//         setIsMuted(true);
//       }
//     }
//   }, [gameState?.myInfo, publisher, session, canSpeak]);

//   if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
//     return null;
//   }

//   const toggleMute = () => {
//     if (publisher && canSpeak()) {
//       const newMuteState = !isMuted;
//       publisher.publishAudio(!newMuteState);
//       setIsMuted(newMuteState);

//       console.log('Mute toggled:', {
//         newState: newMuteState,
//         publisherAudio: publisher.stream?.audioActive,
//       });
//     }
//   };

//   if (!canSpeak()) {
//     return null;
//   }

//   return (
//     <div className="absolute bottom-4 right-4 z-50">
//       <div style={{ display: 'none' }}>
//         {subscribers.map((sub) => {
//           console.log('Rendering subscriber audio:', sub.stream.streamId);
//           return (
//             <audio
//               key={sub.stream.streamId}
//               id={`audio-${sub.stream.streamId}`}
//               autoPlay
//               playsInline
//             />
//           );
//         })}
//       </div>

//       <button
//         type="button"
//         onClick={toggleMute}
//         className={`p-2 rounded-full ${
//           isMuted
//             ? 'bg-red-900 border-2 border-red-600'
//             : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'
//         } text-white transition-all duration-200 shadow-lg`}
//         title={isMuted ? '음소거 해제' : '음소거'}
//       >
//         {isMuted ? '🔇' : '🎤'}
//       </button>

//       {availableMicrophones.length > 0 && (
//         <div className="absolute bottom-full mb-2 right-0 p-2 bg-gray-800 rounded-lg border border-gray-600">
//           <select
//             className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
//             onChange={async (e) => {
//               if (publisher) {
//                 try {
//                   const newStream = await navigator.mediaDevices.getUserMedia({
//                     audio: {
//                       deviceId: { exact: e.target.value },
//                       echoCancellation: true,
//                       noiseSuppression: true,
//                       autoGainControl: true,
//                     },
//                   });
//                   publisher.replaceTrack(newStream.getAudioTracks()[0]);
//                   startAudioLevelMonitoring(newStream);
//                 } catch (error) {
//                   console.error('Error switching microphone:', error);
//                 }
//               }
//             }}
//           >
//             {availableMicrophones.map((device) => (
//               <option
//                 key={device.deviceId}
//                 value={device.deviceId}
//               >
//                 {device.label || `Microphone ${device.deviceId}`}
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }

// export default VoiceChat;

// import { useEffect, useState, useRef, useCallback } from 'react';
// import {
//   OpenVidu,
//   Publisher,
//   Session,
//   StreamManager,
//   Subscriber,
//   PublisherProperties,
// } from 'openvidu-browser';

// interface VoiceChatProps {
//   roomId: string | number;
//   participantNo: number | null;
//   nickname: string;
//   gameState: {
//     roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED' | null;
//     isNight?: boolean;
//     myInfo?: {
//       playerNo: number;
//       nickname: string;
//       subscriptions: string[];
//       isDead: boolean;
//       role: string;
//       muteAudio: boolean;
//       muteMic: boolean;
//       openviduToken: string;
//     };
//     participant: Record<
//       string,
//       {
//         isDead?: boolean;
//         role?: string;
//       }
//     >;
//   } | null;
// }

// function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
//   const [session, setSession] = useState<Session | null>(null);
//   const [publisher, setPublisher] = useState<Publisher | null>(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
//   const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
//   const audioElements = useRef<Record<string, HTMLAudioElement>>({});
//   const audioAnalyserInterval = useRef<number | null>(null);
//   const audioContext = useRef<AudioContext | null>(null);

//   // 게임 규칙에 따른 권한 체크
//   const canSpeak = useCallback(() => {
//     if (!gameState?.myInfo) return false;

//     if (gameState.myInfo.isDead) return false;
//     if (gameState.isNight && gameState.myInfo.role !== 'ZOMBIE') return false;
//     if (gameState.myInfo.muteMic) return false;

//     return true;
//   }, [gameState?.myInfo, gameState?.isNight]);

//   // 특정 스트림을 구독할 수 있는지 체크
//   const canSubscribeToStream = useCallback(
//     (streamRole?: string) => {
//       if (!gameState?.myInfo) return false;

//       if (gameState.myInfo.isDead) return true;
//       if (!gameState.isNight) return true;
//       if (gameState.isNight && gameState.myInfo.role === 'ZOMBIE' && streamRole === 'ZOMBIE') {
//         return true;
//       }

//       return true;
//     },
//     [gameState?.myInfo, gameState?.isNight],
//   );

//   // 사용 가능한 마이크 목록 가져오기
//   const getAvailableMicrophones = async () => {
//     try {
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const audioDevices = devices.filter((device) => device.kind === 'audioinput');
//       setAvailableMicrophones(audioDevices);
//       console.log(
//         'Available Microphones:',
//         audioDevices.map((device) => ({
//           deviceId: device.deviceId,
//           label: device.label,
//           groupId: device.groupId,
//         })),
//       );
//       return audioDevices;
//     } catch (error) {
//       console.error('Error getting audio devices:', error);
//       return [];
//     }
//   };

//   // 오디오 레벨 모니터링 시작
//   const startAudioLevelMonitoring = (mediaStream: MediaStream) => {
//     try {
//       if (!audioContext.current) {
//         audioContext.current = new AudioContext();
//       }

//       const analyser = audioContext.current.createAnalyser();
//       const source = audioContext.current.createMediaStreamSource(mediaStream);
//       source.connect(analyser);
//       analyser.fftSize = 256;

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);

//       if (audioAnalyserInterval.current) {
//         clearInterval(audioAnalyserInterval.current);
//       }

//       audioAnalyserInterval.current = window.setInterval(() => {
//         analyser.getByteFrequencyData(dataArray);
//         const audioLevel = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
//         if (audioLevel > 0) {
//           console.log('Current Audio Level:', audioLevel.toFixed(2));
//         }
//       }, 1000) as unknown as number;
//     } catch (error) {
//       console.error('Error setting up audio monitoring:', error);
//     }
//   };

//   // 오디오 엘리먼트 생성
//   const createAudioElement = (streamManager: StreamManager) => {
//     try {
//       const audioElement = document.createElement('audio');
//       const mediaStream = streamManager.stream.getMediaStream();
//       audioElement.srcObject = mediaStream;
//       audioElement.id = `audio-${streamManager.stream.streamId}`;
//       audioElement.autoplay = true;
//       audioElement.setAttribute('playsinline', 'true');

//       if (streamManager === publisher) {
//         audioElement.volume = 0;
//         audioElement.muted = true;
//       } else {
//         audioElement.volume = 1.0;
//       }

//       document.body.appendChild(audioElement);
//       audioElements.current[streamManager.stream.streamId] = audioElement;

//       console.log('Audio element created:', {
//         streamId: streamManager.stream.streamId,
//         audioTracks: mediaStream.getAudioTracks().length,
//         trackInfo: mediaStream.getAudioTracks().map((track) => ({
//           enabled: track.enabled,
//           muted: track.muted,
//           readyState: track.readyState,
//           label: track.label,
//         })),
//       });

//       audioElement.onplay = () =>
//         console.log('Audio started playing:', streamManager.stream.streamId);
//       audioElement.onpause = () => console.log('Audio paused:', streamManager.stream.streamId);
//       audioElement.onerror = (e) => console.error('Audio error:', e);
//     } catch (error) {
//       console.error('Error creating audio element:', error);
//     }
//   };

//   useEffect(() => {
//     if (gameState?.roomStatus === 'PLAYING' && participantNo !== null && gameState.myInfo) {
//       const initializeVoiceChat = async () => {
//         if (!gameState.myInfo) return;

//         try {
//           const audioDevices = await getAvailableMicrophones();

//           const defaultMic = audioDevices.find(
//             (device) =>
//               device.label.toLowerCase().includes('default') ||
//               device.label.toLowerCase().includes('built-in') ||
//               device.label.toLowerCase().includes('internal'),
//           );

//           const mediaStream = await navigator.mediaDevices.getUserMedia({
//             audio: defaultMic
//               ? {
//                   deviceId: { exact: defaultMic.deviceId },
//                   echoCancellation: true,
//                   noiseSuppression: true,
//                   autoGainControl: true,
//                 }
//               : true,
//           });

//           startAudioLevelMonitoring(mediaStream);

//           const OV = new OpenVidu();
//           OV.enableProdMode();

//           const token = gameState.myInfo.openviduToken;
//           if (!token) {
//             throw new Error('OpenVidu token not found');
//           }

//           const session = OV.initSession();

//           session.on('streamCreated', (event) => {
//             try {
//               const connectionData = event.stream.connection.data;
//               const closingBraceIndex = connectionData.indexOf('}');
//               const cleanConnectionData = connectionData.substring(0, closingBraceIndex + 1);

//               const streamData =
//                 typeof connectionData === 'string' && connectionData.includes('clientData')
//                   ? JSON.parse(cleanConnectionData)
//                   : { clientData: connectionData };

//               if (canSubscribeToStream(streamData.role)) {
//                 const subscriber = session.subscribe(event.stream, undefined);
//                 setSubscribers((prev) => [...prev, subscriber]);
//                 createAudioElement(subscriber);
//                 console.log('Subscribed to stream from:', streamData.clientData);
//               } else {
//                 console.log('Stream subscription blocked due to game rules');
//               }
//             } catch (error) {
//               console.log('Stream handling error:', error);
//             }
//           });

//           session.on('streamDestroyed', (event) => {
//             const audioElement = audioElements.current[event.stream.streamId];
//             if (audioElement) {
//               audioElement.remove();
//               delete audioElements.current[event.stream.streamId];
//             }
//             setSubscribers((prev) =>
//               prev.filter((sub) => sub.stream.streamId !== event.stream.streamId),
//             );
//           });

//           await session.connect(token, {
//             clientData: JSON.stringify({
//               nickname,
//               role: gameState.myInfo.role,
//               isDead: gameState.myInfo.isDead,
//             }),
//           });

//           if (canSpeak()) {
//             const publisherProperties: PublisherProperties = {
//               audioSource: defaultMic?.deviceId || undefined,
//               videoSource: false,
//               publishAudio: true,
//               publishVideo: false,
//               mirror: false,
//             };

//             const publisher = await OV.initPublisher(undefined, publisherProperties);
//             await session.publish(publisher);

//             setPublisher(publisher);
//             setIsMuted(false);
//             createAudioElement(publisher);
//           }

//           setSession(session);
//         } catch (error) {
//           console.error('Voice chat initialization error:', error);
//         }
//       };

//       initializeVoiceChat();
//     }

//     return () => {
//       if (audioAnalyserInterval.current) {
//         clearInterval(audioAnalyserInterval.current);
//       }
//       if (audioContext.current) {
//         audioContext.current.close();
//       }
//       if (session) {
//         try {
//           Object.values(audioElements.current).forEach((audio) => audio.remove());
//           audioElements.current = {};

//           if (publisher) {
//             session.unpublish(publisher);
//           }
//           session.disconnect();
//           setSession(null);
//           setPublisher(null);
//           setSubscribers([]);
//         } catch (error) {
//           console.error('Cleanup error:', error);
//         }
//       }
//     };
//   }, [
//     roomId,
//     participantNo,
//     nickname,
//     gameState?.roomStatus,
//     gameState?.myInfo,
//     gameState?.isNight,
//     canSpeak,
//     canSubscribeToStream,
//   ]);

//   useEffect(() => {
//     if (publisher && gameState?.myInfo) {
//       if (!canSpeak()) {
//         session?.unpublish(publisher);
//         setPublisher(null);
//         setIsMuted(true);
//       }
//     }
//   }, [gameState?.myInfo, publisher, session, canSpeak]);

//   if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
//     return null;
//   }

//   const toggleMute = () => {
//     if (publisher && canSpeak()) {
//       const newMuteState = !isMuted;
//       publisher.publishAudio(!newMuteState);
//       setIsMuted(newMuteState);
//     }
//   };

//   if (!canSpeak()) {
//     return null;
//   }

//   return (
//     <div className="absolute bottom-4 right-4 z-50">
//       <div style={{ display: 'none' }}>
//         {subscribers.map((sub) => (
//           <audio
//             key={sub.stream.streamId}
//             id={`audio-${sub.stream.streamId}`}
//             autoPlay
//             playsInline
//           />
//         ))}
//       </div>

//       <button
//         type="button"
//         onClick={toggleMute}
//         className={`p-2 rounded-full ${
//           isMuted
//             ? 'bg-red-900 border-2 border-red-600'
//             : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'
//         } text-white transition-all duration-200 shadow-lg`}
//         title={isMuted ? '음소거 해제' : '음소거'}
//       >
//         {isMuted ? '🔇' : '🎤'}
//       </button>

//       {availableMicrophones.length > 0 && (
//         <div className="absolute bottom-full mb-2 right-0 p-2 bg-gray-800 rounded-lg border border-gray-600">
//           <select
//             className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
//             onChange={async (e) => {
//               if (publisher) {
//                 try {
//                   const newStream = await navigator.mediaDevices.getUserMedia({
//                     audio: {
//                       deviceId: { exact: e.target.value },
//                       echoCancellation: true,
//                       noiseSuppression: true,
//                       autoGainControl: true,
//                     },
//                   });
//                   publisher.replaceTrack(newStream.getAudioTracks()[0]);
//                   startAudioLevelMonitoring(newStream);
//                 } catch (error) {
//                   console.error('Error switching microphone:', error);
//                 }
//               }
//             }}
//           >
//             {availableMicrophones.map((device) => (
//               <option
//                 key={device.deviceId}
//                 value={device.deviceId}
//               >
//                 {device.label || `Microphone ${device.deviceId}`}
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }

// export default VoiceChat;
// import { useEffect, useState } from 'react';
// import { OpenVidu, Publisher, Session } from 'openvidu-browser';

// interface VoiceChatProps {
//   roomId: string | number;
//   participantNo: number | null;
//   nickname: string;
//   gameState: {
//     roomStatus: string;
//     isNight?: boolean;
//     myInfo?: {
//       playerNo: number;
//       nickname: string;
//       subscriptions: string[];
//       isDead: boolean;
//       role: string;
//       muteAudio: boolean;
//       muteMic: boolean;
//       openviduToken: string;
//     };
//     participant: Record<
//       string,
//       {
//         isDead?: boolean;
//         role?: string;
//       }
//     >;
//   } | null;
// }

// function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
//   const [session, setSession] = useState<Session | null>(null);
//   const [publisher, setPublisher] = useState<Publisher | null>(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState('disconnected');

//   const checkAudioTracks = (pub: Publisher) => {
//     try {
//       // OpenVidu의 Stream 객체인 경우
//       if (pub.stream?.audioActive !== undefined) {
//         console.log('OpenVidu Stream audio status:', {
//           audioActive: pub.stream.audioActive,
//           streamId: pub.stream.streamId,
//         });
//         return pub.stream.audioActive;
//       }

//       // MediaStream 타입으로 직접 접근 시도
//       if (pub.stream instanceof MediaStream) {
//         const audioTracks = pub.stream.getAudioTracks();
//         console.log('MediaStream Audio Tracks:', {
//           count: audioTracks?.length,
//           tracks: audioTracks?.map((track) => ({
//             enabled: track.enabled,
//             muted: track.muted,
//             readyState: track.readyState,
//             label: track.label,
//           })),
//         });
//         return audioTracks?.some((track) => track.enabled && track.readyState === 'live') ?? false;
//       }

//       console.log('Unknown stream type:', pub.stream);
//       return false;
//     } catch (error) {
//       console.error('Error checking audio tracks:', error);
//       return false;
//     }
//   };

//   useEffect(() => {
//     console.log('VoiceChat Init:', {
//       roomId,
//       participantNo,
//       nickname,
//       gameState: {
//         status: gameState?.roomStatus,
//         myInfo: gameState?.myInfo,
//         hasToken: !!gameState?.myInfo?.openviduToken,
//       },
//       connectionStatus,
//     });

//     if (gameState?.roomStatus === 'PLAYING' && participantNo !== null && gameState.myInfo) {
//       const initializeVoiceChat = async () => {
//         if (!gameState.myInfo) {
//           console.log('No myInfo available');
//           return;
//         }

//         try {
//           const OV = new OpenVidu();
//           OV.enableProdMode();
//           setConnectionStatus('connecting');
//           console.log('OpenVidu instance created');

//           const token = gameState.myInfo.openviduToken;
//           if (!token) {
//             throw new Error('OpenVidu token not found');
//           }

//           const session = OV.initSession();
//           console.log('Session initialized');

//           // 스트림 생성 이벤트 핸들러
//           session.on('streamCreated', (event) => {
//             console.log('Stream created event:', {
//               stream: event.stream,
//               connectionData: event.stream.connection.data,
//               connectionType: typeof event.stream.connection.data,
//             });

//             try {
//               const connectionData = event.stream.connection.data;

//               const closingBraceIndex = connectionData.indexOf('}');
//               const cleanConnectionData = connectionData.substring(0, closingBraceIndex + 1);
//               console.log(cleanConnectionData);

//               const streamData =
//                 typeof connectionData === 'string' && connectionData.includes('clientData')
//                   ? JSON.parse(cleanConnectionData)
//                   : { clientData: connectionData };

//               if (
//                 !gameState.isNight ||
//                 gameState.myInfo?.isDead ||
//                 gameState.myInfo?.role === 'ZOMBIE'
//               ) {
//                 session.subscribe(event.stream, undefined);
//                 console.log('Subscribed to stream from:', streamData.clientData);
//               } else {
//                 console.log('Stream subscription blocked due to night time rules');
//               }
//             } catch (error) {
//               console.log('Failed to parse stream data, subscribing anyway:', error);
//               session.subscribe(event.stream, undefined);
//             }
//           });

//           session.on('streamDestroyed', (event) => {
//             console.log('Stream destroyed:', {
//               stream: event.stream,
//               connectionData: event.stream.connection.data,
//             });
//           });

//           session.on('connectionCreated', (event) => {
//             console.log('New connection created:', event.connection);
//           });

//           session.on('connectionDestroyed', (event) => {
//             console.log('Connection destroyed:', event.connection);
//           });

//           await session.connect(token, {
//             clientData: nickname,
//             maxRetries: 3,
//             requestTimeout: 8000,
//           });
//           console.log('Session connected successfully');
//           setConnectionStatus('connected');

//           if (!gameState.myInfo.muteMic) {
//             console.log('Initializing publisher...');
//             const publisher = await OV.initPublisher(undefined, {
//               audioSource: undefined,
//               videoSource: false,
//               publishAudio: !gameState.myInfo.muteMic,
//               publishVideo: false,
//               mirror: false,
//             });

//             console.log('Publisher created, checking audio status:', {
//               hasAudioTrack: checkAudioTracks(publisher),
//               audioActive: publisher.stream?.audioActive,
//               streamId: publisher.stream?.streamId,
//             });

//             await session.publish(publisher);
//             console.log('Stream published successfully:', {
//               audioActive: publisher.stream?.audioActive,
//               streamId: publisher.stream?.streamId,
//             });

//             setPublisher(publisher);
//             setIsMuted(gameState.myInfo.muteMic);
//           }

//           setSession(session);
//         } catch (error) {
//           console.error('Voice chat initialization error:', error);
//           setConnectionStatus('error');
//         }
//       };

//       initializeVoiceChat();
//     }

//     return () => {
//       if (session) {
//         try {
//           if (publisher) {
//             console.log('Cleanup: Unpublishing stream');
//             session.unpublish(publisher);
//           }
//           console.log('Cleanup: Disconnecting session');
//           session.disconnect();
//           setConnectionStatus('disconnected');
//           setSession(null);
//           setPublisher(null);
//         } catch (error) {
//           console.error('Cleanup error:', error);
//         }
//       }
//     };
//   }, [
//     roomId,
//     participantNo,
//     nickname,
//     gameState?.roomStatus,
//     gameState?.myInfo,
//     gameState?.isNight,
//   ]);

//   useEffect(() => {
//     if (publisher && gameState?.myInfo) {
//       console.log('Player state changed:', {
//         muteMic: gameState.myInfo.muteMic,
//         isDead: gameState.myInfo.isDead,
//         audioActive: publisher.stream?.audioActive,
//       });

//       if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
//         console.log('Unpublishing stream due to state change');
//         session?.unpublish(publisher);
//         setPublisher(null);
//       }
//       setIsMuted(gameState.myInfo.muteMic || gameState.myInfo.isDead);
//     }
//   }, [gameState?.myInfo, publisher, session]);

//   if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
//     return null;
//   }

//   if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
//     return null;
//   }

//   const toggleMute = () => {
//     if (publisher && !gameState.myInfo?.muteMic && !gameState.myInfo?.isDead) {
//       const newMuteState = !isMuted;
//       console.log('Toggling mute state:', {
//         newState: newMuteState,
//         currentAudioActive: publisher.stream?.audioActive,
//       });

//       publisher.publishAudio(!newMuteState);
//       setIsMuted(newMuteState);

//       setTimeout(() => {
//         console.log('Post-toggle audio state:', {
//           audioActive: publisher.stream?.audioActive,
//         });
//       }, 100);
//     }
//   };

//   return (
//     <div className="absolute bottom-4 right-4 z-50">
//       <button
//         type="button"
//         onClick={toggleMute}
//         className={`p-2 rounded-full ${
//           isMuted
//             ? 'bg-red-900 border-2 border-red-600'
//             : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'
//         } text-white transition-all duration-200 shadow-lg`}
//         title={isMuted ? '음소거 해제' : '음소거'}
//       >
//         {isMuted ? '🔇' : '🎤'}
//       </button>
//     </div>
//   );
// }

// export default VoiceChat;
// import { useEffect, useState } from 'react';
// import { OpenVidu, Publisher, Session } from 'openvidu-browser';

// interface VoiceChatProps {
//   roomId: string | number;
//   participantNo: number | null;
//   nickname: string;
//   gameState: {
//     roomStatus: string;
//     isNight?: boolean;
//     myInfo?: {
//       playerNo: number;
//       nickname: string;
//       subscriptions: string[];
//       isDead: boolean;
//       role: string;
//       muteAudio: boolean;
//       muteMic: boolean;
//       openviduToken: string;
//     };
//     participant: Record<
//       string,
//       {
//         isDead?: boolean;
//         role?: string;
//       }
//     >;
//   } | null;
// }

// function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
//   const [session, setSession] = useState<Session | null>(null);
//   const [publisher, setPublisher] = useState<Publisher | null>(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [, setConnectionStatus] = useState('disconnected');

//   useEffect(() => {
//     console.log('VoiceChat Init:', {
//       roomId,
//       participantNo,
//       nickname,
//       gameState: {
//         status: gameState?.roomStatus,
//         myInfo: gameState?.myInfo,
//         hasToken: !!gameState?.myInfo?.openviduToken,
//       },
//     });

//     if (gameState?.roomStatus === 'PLAYING' && participantNo !== null && gameState.myInfo) {
//       const initializeVoiceChat = async () => {
//         if (!gameState.myInfo) {
//           console.log('No myInfo available');
//           return;
//         }

//         try {
//           const OV = new OpenVidu();
//           OV.enableProdMode();
//           setConnectionStatus('connecting');

//           const token = gameState.myInfo.openviduToken;
//           if (!token) {
//             throw new Error('OpenVidu token not found');
//           }

//           const session = OV.initSession();
//           console.log('Session initialized');

//           // 다른 참가자의 스트림 구독
//           session.on('streamCreated', (event) => {
//             console.log('Stream created event:', event.stream);
//             try {
//               // clientData 형식으로 연결 데이터 파싱 시도
//               const streamData = JSON.parse(event.stream.connection.data);
//               console.log('Stream connection data:', streamData);

//               // 밤에는 좀비만 다른 좀비의 음성을 들을 수 있음
//               if (
//                 !gameState.isNight ||
//                 gameState.myInfo?.isDead ||
//                 gameState.myInfo?.role === 'ZOMBIE'
//               ) {
//                 session.subscribe(event.stream, undefined);
//                 console.log('Subscribed to stream from:', streamData.clientData);
//               } else {
//                 console.log('Stream subscription blocked due to night time rules');
//               }
//             } catch (error) {
//               // 파싱 실패시 기본 구독
//               console.log('Failed to parse stream data, subscribing anyway:', error);
//               session.subscribe(event.stream, undefined);
//             }
//           });

//           session.on('streamDestroyed', (event) => {
//             try {
//               const streamData = JSON.parse(event.stream.connection.data);
//               console.log('Stream destroyed:', streamData.clientData);
//             } catch (error) {
//               console.log('Stream destroyed (unknown user)');
//             }
//           });

//           // 세션 연결 시 clientData 포함
//           await session.connect(token, {
//             clientData: nickname,
//             maxRetries: 3,
//             requestTimeout: 8000,
//           });
//           console.log('Session connected');
//           setConnectionStatus('connected');

//           // 음성 전송 설정
//           if (!gameState.myInfo.muteMic) {
//             const publisher = await OV.initPublisher(undefined, {
//               audioSource: undefined,
//               videoSource: false,
//               publishAudio: !gameState.myInfo.muteMic,
//               publishVideo: false,
//               mirror: false,
//             });

//             await session.publish(publisher);
//             console.log('Publisher created and stream published');
//             setPublisher(publisher);
//             setIsMuted(gameState.myInfo.muteMic);
//           }

//           setSession(session);
//         } catch (error) {
//           console.error('Voice chat initialization error:', error);
//           setConnectionStatus('error');
//         }
//       };

//       initializeVoiceChat();
//     }

//     return () => {
//       if (session) {
//         try {
//           if (publisher) {
//             console.log('Unpublishing stream');
//             session.unpublish(publisher);
//           }
//           console.log('Disconnecting session');
//           session.disconnect();
//           setConnectionStatus('disconnected');
//           setSession(null);
//           setPublisher(null);
//         } catch (error) {
//           console.error('Cleanup error:', error);
//         }
//       }
//     };
//   }, [
//     roomId,
//     participantNo,
//     nickname,
//     gameState?.roomStatus,
//     gameState?.myInfo,
//     gameState?.isNight,
//   ]);

//   // 플레이어 상태 변경 감지
//   useEffect(() => {
//     if (publisher && gameState?.myInfo) {
//       if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
//         console.log('Player state changed, unpublishing stream');
//         session?.unpublish(publisher);
//         setPublisher(null);
//       }
//       setIsMuted(gameState.myInfo.muteMic || gameState.myInfo.isDead);
//     }
//   }, [gameState?.myInfo, publisher, session]);

//   if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
//     return null;
//   }

//   if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
//     return null;
//   }

//   const toggleMute = () => {
//     if (publisher && !gameState.myInfo?.muteMic && !gameState.myInfo?.isDead) {
//       const newMuteState = !isMuted;
//       console.log('Toggling mute state:', newMuteState);
//       publisher.publishAudio(!newMuteState);
//       setIsMuted(newMuteState);
//     }
//   };

//   return (
//     <div className="absolute bottom-4 right-4 z-50">
//       <button
//         type="button"
//         onClick={toggleMute}
//         className={`p-2 rounded-full ${
//           isMuted
//             ? 'bg-red-900 border-2 border-red-600'
//             : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'
//         } text-white transition-all duration-200 shadow-lg`}
//         title={isMuted ? '음소거 해제' : '음소거'}
//       >
//         {isMuted ? '🔇' : '🎤'}
//       </button>
//     </div>
//   );
// }

// export default VoiceChat;
// import { useEffect, useState } from 'react';
// import { OpenVidu, Publisher, Session } from 'openvidu-browser';

// const OPENVIDU_SERVER_URL = 'https://i12d101.p.ssafy.io:8443';

// interface VoiceChatProps {
//   roomId: string | number;
//   participantNo: number | null;
//   nickname: string;
//   gameState: {
//     roomStatus: string;
//     participant: {
//       [key: string]: {
//         isDead?: boolean;
//       };
//     };
//   } | null;
// }

// function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
//   const [session, setSession] = useState<Session | null>(null);
//   const [publisher, setPublisher] = useState<Publisher | null>(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [, setConnectionStatus] = useState('disconnected');

//   useEffect(() => {
//     // 게임이 시작되었을 때 음성 채팅 초기화 (죽은 사람도 들을 수 있도록)
//     if (gameState?.roomStatus === 'PLAYING' && participantNo !== null) {
//       const initializeVoiceChat = async () => {
//         try {
//           const OV = new OpenVidu();
//           OV.enableProdMode();
//           setConnectionStatus('connecting');

//           const sessionResponse = await fetch(`${OPENVIDU_SERVER_URL}/api/sessions`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               Authorization: `Basic ${btoa('OPENVIDUAPP:fuckauth')}`,
//             },
//             body: JSON.stringify({}),
//           });
//           const sessionId = await sessionResponse.text();
//           console.log('세션 생성됨:', sessionId);

//           const tokenResponse = await fetch(
//             `${OPENVIDU_SERVER_URL}/api/sessions/${sessionId}/connections`,
//             {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Basic ${btoa('OPENVIDUAPP:fuckauth')}`,
//               },
//               body: JSON.stringify({
//                 data: JSON.stringify({
//                   participantNo,
//                   nickname,
//                   isDead: gameState.participant[nickname]?.isDead || false,
//                 }),
//               }),
//             },
//           );

//           const tokenUrl = await tokenResponse.text();
//           const token = tokenUrl.split('token=')[1]; // URL에서 실제 토큰 값만 추출
//           console.log('토큰 발급됨:', token);

//           const session = OV.initSession();

//           // 다른 참가자의 스트림 구독 (죽은 사람도 들을 수 있음)
//           session.on('streamCreated', (event) => {
//             const streamData = JSON.parse(event.stream.connection.data);
//             console.log(`${streamData.nickname} 음성 채팅 참여`);
//             session.subscribe(event.stream, undefined);
//           });

//           session.on('streamDestroyed', (event) => {
//             const streamData = JSON.parse(event.stream.connection.data);
//             console.log(`${streamData.nickname} 음성 채팅 종료`);
//           });

//           await session.connect(token, {
//             maxRetries: 3,
//             requestTimeout: 8000,
//           });
//           setConnectionStatus('connected');
//           console.log('세션 연결 완료');

//           // 살아있는 사람만 음성 전송 가능
//           if (!gameState.participant[nickname]?.isDead) {
//             const publisher = await OV.initPublisher(undefined, {
//               audioSource: undefined,
//               videoSource: false,
//               publishAudio: true,
//               publishVideo: false,
//             });

//             await session.publish(publisher);
//             console.log('스트림 발행 완료');
//             setPublisher(publisher);
//           }

//           setSession(session);
//         } catch (error) {
//           console.error('음성 채팅 초기화 오류:', error);
//           setConnectionStatus('error');
//         }
//       };

//       initializeVoiceChat();
//     }

//     return () => {
//       if (session) {
//         if (publisher) {
//           session.unpublish(publisher);
//         }
//         session.disconnect();
//         setConnectionStatus('disconnected');
//         setSession(null);
//         setPublisher(null);
//       }
//     };
//   }, [roomId, participantNo, nickname, gameState?.roomStatus, gameState?.participant]);

//   // 플레이어가 죽었을 때 음성 전송 중지
//   useEffect(() => {
//     if (publisher && gameState?.participant[nickname]) {
//       const isDead = gameState.participant[nickname].isDead ?? false;
//       if (isDead) {
//         session?.unpublish(publisher);
//         setPublisher(null);
//       }
//       setIsMuted(isDead);
//     }
//   }, [gameState?.participant, nickname, publisher, session]);

//   if (gameState?.roomStatus !== 'PLAYING') {
//     return null;
//   }

//   const toggleMute = () => {
//     if (publisher && !gameState?.participant[nickname]?.isDead) {
//       const newMuteState = !isMuted;
//       publisher.publishAudio(!newMuteState);
//       setIsMuted(newMuteState);
//     }
//   };

//   // 죽은 플레이어는 버튼을 보여주지 않음
//   if (gameState?.participant[nickname]?.isDead) {
//     return null;
//   }

//   return (
//     <div className="absolute bottom-4 right-4 z-50">
//       <button
//         type="button"
//         onClick={toggleMute}
//         className={`p-2 rounded-full ${
//           isMuted
//             ? 'bg-red-900 border-2 border-red-600'
//             : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'
//         } text-white transition-all duration-200 shadow-lg`}
//         title={isMuted ? '음소거 해제' : '음소거'}
//       >
//         {isMuted ? '🔇' : '🎤'}
//       </button>
//     </div>
//   );
// }

// export default VoiceChat;

// // import { useEffect, useState } from 'react';
// // import { OpenVidu, Publisher, Session } from 'openvidu-browser';

// // const OPENVIDU_SERVER_URL = 'https://i12d101.p.ssafy.io';

// // interface VoiceChatProps {
// //   roomId: string | number;
// //   participantNo: number | null;
// //   nickname: string;
// //   gameState: {
// //     roomStatus: string;
// //     participant: {
// //       [key: string]: {
// //         isDead?: boolean;
// //       };
// //     };
// //   } | null;
// // }

// // function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
// //   const [session, setSession] = useState<Session | null>(null);
// //   const [publisher, setPublisher] = useState<Publisher | null>(null);
// //   const [isMuted, setIsMuted] = useState(false);
// //   const [, setConnectionStatus] = useState('disconnected');

// //   useEffect(() => {
// //     // 게임이 시작되었을 때 음성 채팅 초기화 (죽은 사람도 들을 수 있도록)
// //     if (gameState?.roomStatus === 'PLAYING' && participantNo !== null) {
// //       const initializeVoiceChat = async () => {
// //         try {
// //           const OV = new OpenVidu();
// //           setConnectionStatus('connecting');

// //           const sessionResponse = await fetch(`${OPENVIDU_SERVER_URL}/api/sessions`, {
// //             method: 'POST',
// //             headers: {
// //               'Content-Type': 'application/json',
// //               'Access-Control-Allow-Origin': '*',
// //               Authorization: `Basic ${btoa('OPENVIDUAPP:fuckauth')}`,
// //             },
// //           });
// //           const sessionId = await sessionResponse.text();
// //           console.log('세션 생성됨:', sessionId);

// //           const tokenResponse = await fetch(
// //             `${OPENVIDU_SERVER_URL}/api/sessions/${sessionId}/connections`,
// //             {
// //               method: 'POST',
// //               headers: {
// //                 'Content-Type': 'application/json',
// //                 'Access-Control-Allow-Origin': '*',
// //               },
// //               body: JSON.stringify({
// //                 data: JSON.stringify({
// //                   participantNo,
// //                   nickname,
// //                   isDead: gameState.participant[nickname]?.isDead || false,
// //                 }),
// //               }),
// //             },
// //           );
// //           const token = await tokenResponse.text();
// //           console.log('토큰 발급됨:', token);

// //           const initialSession = OV.initSession();

// //           // 다른 참가자의 스트림 구독 (죽은 사람도 들을 수 있음)
// //           initialSession.on('streamCreated', (event) => {
// //             const streamData = JSON.parse(event.stream.connection.data);
// //             console.log(`${streamData.nickname} 음성 채팅 참여`);
// //             initialSession.subscribe(event.stream, undefined);
// //           });

// //           initialSession.on('streamDestroyed', (event) => {
// //             const streamData = JSON.parse(event.stream.connection.data);
// //             console.log(`${streamData.nickname} 음성 채팅 종료`);
// //           });

// //           await initialSession.connect(token);
// //           setConnectionStatus('connected');
// //           console.log('세션 연결 완료');

// //           // 살아있는 사람만 음성 전송 가능
// //           if (!gameState.participant[nickname]?.isDead) {
// //             const initialPublisher = await OV.initPublisher(undefined, {
// //               audioSource: undefined,
// //               videoSource: false,
// //               publishAudio: true,
// //               publishVideo: false,
// //             });

// //             await initialSession.publish(initialPublisher);
// //             console.log('스트림 발행 완료');
// //             setPublisher(initialPublisher);
// //           }

// //           setSession(initialSession);
// //         } catch (error) {
// //           console.error('음성 채팅 초기화 오류:', error);
// //           setConnectionStatus('error');
// //         }
// //       };

// //       initializeVoiceChat();
// //     }

// //     return () => {
// //       if (session) {
// //         if (publisher) {
// //           session.unpublish(publisher);
// //         }
// //         session.disconnect();
// //         setConnectionStatus('disconnected');
// //         setSession(null);
// //         setPublisher(null);
// //       }
// //     };
// //   }, [roomId, participantNo, nickname, gameState?.roomStatus, gameState?.participant]);

// //   // 플레이어가 죽었을 때 음성 전송 중지
// //   useEffect(() => {
// //     if (publisher && gameState?.participant[nickname]) {
// //       const isDead = gameState.participant[nickname].isDead ?? false;
// //       if (isDead) {
// //         session?.unpublish(publisher);
// //         setPublisher(null);
// //       }
// //       setIsMuted(isDead);
// //     }
// //   }, [gameState?.participant, nickname, publisher, session]);

// //   if (gameState?.roomStatus !== 'PLAYING') {
// //     return null;
// //   }

// //   const toggleMute = () => {
// //     if (publisher && !gameState?.participant[nickname]?.isDead) {
// //       const newMuteState = !isMuted;
// //       publisher.publishAudio(!newMuteState);
// //       setIsMuted(newMuteState);
// //     }
// //   };

// //   // 죽은 플레이어는 버튼을 보여주지 않음
// //   if (gameState?.participant[nickname]?.isDead) {
// //     return null;
// //   }

// //   return (
// //     <div className="absolute bottom-4 right-4 z-50">
// //       <button
// //         type="button"
// //         onClick={toggleMute}
// //         className={`p-2 rounded-full ${
// //           isMuted
// //             ? 'bg-red-900 border-2 border-red-600'
// //             : 'bg-gray-800 border-2 border-gray-600 hover:bg-gray-700'
// //         } text-white transition-all duration-200 shadow-lg`}
// //         title={isMuted ? '음소거 해제' : '음소거'}
// //       >
// //         {isMuted ? '🔇' : '🎤'}
// //       </button>
// //     </div>
// //   );
// // }

// // export default VoiceChat;
