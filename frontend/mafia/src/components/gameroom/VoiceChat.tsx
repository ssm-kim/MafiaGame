import { useEffect, useState } from 'react';
import { OpenVidu, Publisher, Session } from 'openvidu-browser';

interface VoiceChatProps {
  roomId: string | number;
  participantNo: number | null;
  nickname: string;
  gameState: {
    roomStatus: string;
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
    playersInfo: Record<
      number,
      {
        playerNo: number;
        nickname: string;
        isDead: boolean;
      }
    >;
  } | null;
}

function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // 디버깅: 초기 props 확인
    console.log('VoiceChat Props:', {
      roomId,
      participantNo,
      nickname,
      gameState: {
        roomStatus: gameState?.roomStatus,
        isNight: gameState?.isNight,
        myInfo: gameState?.myInfo
          ? {
              ...gameState.myInfo,
              openviduToken: !!gameState.myInfo.openviduToken, // 토큰 존재 여부만 표시
            }
          : null,
      },
    });

    // 게임이 시작되었을 때 음성 채팅 초기화 (죽은 사람도 들을 수 있도록)
    if (gameState?.roomStatus === 'PLAYING' && participantNo !== null && gameState.myInfo) {
      console.log('Initializing voice chat with conditions:', {
        roomStatus: gameState.roomStatus,
        participantNo,
        hasMyInfo: !!gameState.myInfo,
      });

      const initializeVoiceChat = async () => {
        // Early return for type safety
        if (!gameState.myInfo) {
          console.log('Early return: myInfo is null');
          return;
        }

        try {
          const OV = new OpenVidu();
          OV.enableProdMode();
          setConnectionStatus('connecting');
          console.log('OpenVidu instance created');

          const token = gameState.myInfo.openviduToken;
          if (!token) {
            console.error('OpenVidu token not found in myInfo');
            throw new Error('OpenVidu token not found');
          }
          console.log('OpenVidu token found');

          const session = OV.initSession();
          console.log('Session initialized');

          // 다른 참가자의 스트림 구독 (죽은 사람도 들을 수 있음)
          session.on('streamCreated', (event) => {
            console.log('Stream created event:', {
              connectionId: event.stream.connection.connectionId,
              streamId: event.stream.streamId,
              connectionData: event.stream.connection.data,
            });

            try {
              const streamData = JSON.parse(event.stream.connection.data);
              console.log('Parsed stream data:', streamData);
              console.log(`${streamData.clientData || 'Unknown user'} 음성 채팅 참여`);

              // 밤에는 좀비만 다른 좀비의 음성을 들을 수 있음
              const shouldBlock =
                gameState.isNight &&
                !gameState.myInfo?.isDead &&
                gameState.myInfo?.role !== 'ZOMBIE';

              console.log('Stream subscription check:', {
                isNight: gameState.isNight,
                isDead: gameState.myInfo?.isDead,
                role: gameState.myInfo?.role,
                shouldBlock,
              });

              if (!shouldBlock) {
                session.subscribe(event.stream, undefined);
                console.log('Subscribed to stream');
              } else {
                console.log('Stream blocked due to game rules');
              }
            } catch (error) {
              console.error('Error handling stream:', error);
              console.log('Raw connection data:', event.stream.connection.data);
              // JSON 파싱 실패해도 일단 구독
              session.subscribe(event.stream, undefined);
              console.log('Subscribed to stream despite parsing error');
            }
          });

          session.on('streamDestroyed', (event) => {
            try {
              const streamData = JSON.parse(event.stream.connection.data);
              console.log('Stream destroyed:', {
                user: streamData.clientData || 'Unknown user',
                streamId: event.stream.streamId,
              });
            } catch (error) {
              console.error('Error parsing stream destroy data:', error);
            }
          });

          console.log('Connecting to session with token length:', token.length);
          await session.connect(token, {
            maxRetries: 3,
            requestTimeout: 8000,
          });
          setConnectionStatus('connected');
          console.log('세션 연결 완료');

          // 음성 전송 권한 확인
          const canPublish = !gameState.myInfo.muteMic;
          console.log('Publishing check:', {
            canPublish,
            muteMic: gameState.myInfo.muteMic,
          });

          if (canPublish) {
            const publisher = await OV.initPublisher(undefined, {
              audioSource: undefined,
              videoSource: false,
              publishAudio: !gameState.myInfo.muteMic,
              publishVideo: false,
            });

            await session.publish(publisher);
            console.log('스트림 발행 완료');
            setPublisher(publisher);
            setIsMuted(gameState.myInfo.muteMic);
          }

          setSession(session);
          console.log('Voice chat initialization complete');
        } catch (error) {
          console.error('음성 채팅 초기화 오류:', error);
          // 에러 상세 정보 출력
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
            });
          }
          setConnectionStatus('error');
        }
      };

      initializeVoiceChat();
    }

    return () => {
      if (session) {
        try {
          console.log('Cleaning up voice chat session');
          if (publisher) {
            session.unpublish(publisher);
            console.log('Publisher unpublished');
          }
          session.disconnect();
          console.log('Session disconnected');
          setConnectionStatus('disconnected');
          setSession(null);
          setPublisher(null);
        } catch (error) {
          console.error('Error during cleanup:', error);
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

  // 플레이어 상태 변경 감지 (사망, 음소거 등)
  useEffect(() => {
    if (publisher && gameState?.myInfo) {
      console.log('Player state change detected:', {
        muteMic: gameState.myInfo.muteMic,
        isDead: gameState.myInfo.isDead,
      });

      if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
        session?.unpublish(publisher);
        setPublisher(null);
        console.log('Publisher removed due to state change');
      }
      setIsMuted(gameState.myInfo.muteMic || gameState.myInfo.isDead);
    }
  }, [gameState?.myInfo, publisher, session]);

  if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
    console.log('VoiceChat not rendered:', {
      roomStatus: gameState?.roomStatus,
      hasMyInfo: !!gameState?.myInfo,
    });
    return null;
  }

  // 마이크 사용 권한이 없으면 버튼 숨김
  if (gameState.myInfo.muteMic || gameState.myInfo.isDead) {
    console.log('Mic button hidden:', {
      muteMic: gameState.myInfo.muteMic,
      isDead: gameState.myInfo.isDead,
    });
    return null;
  }

  const toggleMute = () => {
    console.log('Toggle mute clicked:', {
      currentMuteState: isMuted,
      hasPublisher: !!publisher,
      muteMic: gameState.myInfo?.muteMic,
      isDead: gameState.myInfo?.isDead,
    });

    if (publisher && !gameState.myInfo?.muteMic && !gameState.myInfo?.isDead) {
      const newMuteState = !isMuted;
      publisher.publishAudio(!newMuteState);
      setIsMuted(newMuteState);
      console.log('Mute state changed to:', newMuteState);
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
