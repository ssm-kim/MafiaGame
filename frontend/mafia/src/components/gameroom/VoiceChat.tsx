import { useEffect, useState } from 'react';
import { OpenVidu, Publisher, Session } from 'openvidu-browser';

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
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const checkAudioTracks = (pub: Publisher) => {
    try {
      // OpenVidu의 Stream 객체인 경우
      if (pub.stream?.audioActive !== undefined) {
        console.log('OpenVidu Stream audio status:', {
          audioActive: pub.stream.audioActive,
          streamId: pub.stream.streamId,
        });
        return pub.stream.audioActive;
      }

      // MediaStream 타입으로 직접 접근 시도
      if (pub.stream instanceof MediaStream) {
        const audioTracks = pub.stream.getAudioTracks();
        console.log('MediaStream Audio Tracks:', {
          count: audioTracks?.length,
          tracks: audioTracks?.map((track) => ({
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label,
          })),
        });
        return audioTracks?.some((track) => track.enabled && track.readyState === 'live') ?? false;
      }

      console.log('Unknown stream type:', pub.stream);
      return false;
    } catch (error) {
      console.error('Error checking audio tracks:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('VoiceChat Init:', {
      roomId,
      participantNo,
      nickname,
      gameState: {
        status: gameState?.roomStatus,
        myInfo: gameState?.myInfo,
        hasToken: !!gameState?.myInfo?.openviduToken,
      },
      connectionStatus,
    });

    if (gameState?.roomStatus === 'PLAYING' && participantNo !== null && gameState.myInfo) {
      const initializeVoiceChat = async () => {
        if (!gameState.myInfo) {
          console.log('No myInfo available');
          return;
        }

        try {
          const OV = new OpenVidu();
          OV.enableProdMode();
          setConnectionStatus('connecting');
          console.log('OpenVidu instance created');

          const token = gameState.myInfo.openviduToken;
          if (!token) {
            throw new Error('OpenVidu token not found');
          }

          const session = OV.initSession();
          console.log('Session initialized');

          // 스트림 생성 이벤트 핸들러
          session.on('streamCreated', (event) => {
            console.log('Stream created event:', {
              stream: event.stream,
              connectionData: event.stream.connection.data,
              connectionType: typeof event.stream.connection.data,
            });

            try {
              const connectionData = event.stream.connection.data;

              const closingBraceIndex = connectionData.indexOf('}');
              const cleanConnectionData = connectionData.substring(0, closingBraceIndex + 1);
              console.log(cleanConnectionData);

              const streamData =
                typeof connectionData === 'string' && connectionData.includes('clientData')
                  ? JSON.parse(cleanConnectionData)
                  : { clientData: connectionData };

              if (
                !gameState.isNight ||
                gameState.myInfo?.isDead ||
                gameState.myInfo?.role === 'ZOMBIE'
              ) {
                session.subscribe(event.stream, undefined);
                console.log('Subscribed to stream from:', streamData.clientData);
              } else {
                console.log('Stream subscription blocked due to night time rules');
              }
            } catch (error) {
              console.log('Failed to parse stream data, subscribing anyway:', error);
              session.subscribe(event.stream, undefined);
            }
          });

          session.on('streamDestroyed', (event) => {
            console.log('Stream destroyed:', {
              stream: event.stream,
              connectionData: event.stream.connection.data,
            });
          });

          session.on('connectionCreated', (event) => {
            console.log('New connection created:', event.connection);
          });

          session.on('connectionDestroyed', (event) => {
            console.log('Connection destroyed:', event.connection);
          });

          await session.connect(token, {
            clientData: nickname,
            maxRetries: 3,
            requestTimeout: 8000,
          });
          console.log('Session connected successfully');
          setConnectionStatus('connected');

          if (!gameState.myInfo.muteMic) {
            console.log('Initializing publisher...');
            const publisher = await OV.initPublisher(undefined, {
              audioSource: undefined,
              videoSource: false,
              publishAudio: !gameState.myInfo.muteMic,
              publishVideo: false,
              mirror: false,
            });

            console.log('Publisher created, checking audio status:', {
              hasAudioTrack: checkAudioTracks(publisher),
              audioActive: publisher.stream?.audioActive,
              streamId: publisher.stream?.streamId,
            });

            await session.publish(publisher);
            console.log('Stream published successfully:', {
              audioActive: publisher.stream?.audioActive,
              streamId: publisher.stream?.streamId,
            });

            setPublisher(publisher);
            setIsMuted(gameState.myInfo.muteMic);
          }

          setSession(session);
        } catch (error) {
          console.error('Voice chat initialization error:', error);
          setConnectionStatus('error');
        }
      };

      initializeVoiceChat();
    }

    return () => {
      if (session) {
        try {
          if (publisher) {
            console.log('Cleanup: Unpublishing stream');
            session.unpublish(publisher);
          }
          console.log('Cleanup: Disconnecting session');
          session.disconnect();
          setConnectionStatus('disconnected');
          setSession(null);
          setPublisher(null);
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
  ]);

  useEffect(() => {
    if (publisher && gameState?.myInfo) {
      console.log('Player state changed:', {
        muteMic: gameState.myInfo.muteMic,
        isDead: gameState.myInfo.isDead,
        audioActive: publisher.stream?.audioActive,
      });

      if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
        console.log('Unpublishing stream due to state change');
        session?.unpublish(publisher);
        setPublisher(null);
      }
      setIsMuted(gameState.myInfo.muteMic || gameState.myInfo.isDead);
    }
  }, [gameState?.myInfo, publisher, session]);

  if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
    return null;
  }

  if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
    return null;
  }

  const toggleMute = () => {
    if (publisher && !gameState.myInfo?.muteMic && !gameState.myInfo?.isDead) {
      const newMuteState = !isMuted;
      console.log('Toggling mute state:', {
        newState: newMuteState,
        currentAudioActive: publisher.stream?.audioActive,
      });

      publisher.publishAudio(!newMuteState);
      setIsMuted(newMuteState);

      setTimeout(() => {
        console.log('Post-toggle audio state:', {
          audioActive: publisher.stream?.audioActive,
        });
      }, 100);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-50">
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
    </div>
  );
}

export default VoiceChat;
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
