import { useEffect, useState } from 'react';
import { OpenVidu, Publisher, Session } from 'openvidu-browser';

const OPENVIDU_SERVER_URL = 'https://i12d101.p.ssafy.io';

interface VoiceChatProps {
  roomId: string | number;
  participantNo: number | null;
  nickname: string;
  gameState: {
    roomStatus: string;
    participant: {
      [key: string]: {
        isDead?: boolean;
      };
    };
  } | null;
}

function VoiceChat({ roomId, participantNo, nickname, gameState }: VoiceChatProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // 게임이 시작되었을 때 음성 채팅 초기화 (죽은 사람도 들을 수 있도록)
    if (gameState?.roomStatus === 'PLAYING' && participantNo !== null) {
      const initializeVoiceChat = async () => {
        try {
          const OV = new OpenVidu();
          setConnectionStatus('connecting');

          const sessionResponse = await fetch(`${OPENVIDU_SERVER_URL}/api/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              Authorization: `Basic ${btoa('OPENVIDUAPP:fuckauth')}`,
            },
          });
          const sessionId = await sessionResponse.text();
          console.log('세션 생성됨:', sessionId);

          const tokenResponse = await fetch(
            `${OPENVIDU_SERVER_URL}/api/sessions/${sessionId}/connections`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                data: JSON.stringify({
                  participantNo,
                  nickname,
                  isDead: gameState.participant[nickname]?.isDead || false,
                }),
              }),
            },
          );
          const token = await tokenResponse.text();
          console.log('토큰 발급됨:', token);

          const initialSession = OV.initSession();

          // 다른 참가자의 스트림 구독 (죽은 사람도 들을 수 있음)
          initialSession.on('streamCreated', (event) => {
            const streamData = JSON.parse(event.stream.connection.data);
            console.log(`${streamData.nickname} 음성 채팅 참여`);
            initialSession.subscribe(event.stream, undefined);
          });

          initialSession.on('streamDestroyed', (event) => {
            const streamData = JSON.parse(event.stream.connection.data);
            console.log(`${streamData.nickname} 음성 채팅 종료`);
          });

          await initialSession.connect(token);
          setConnectionStatus('connected');
          console.log('세션 연결 완료');

          // 살아있는 사람만 음성 전송 가능
          if (!gameState.participant[nickname]?.isDead) {
            const initialPublisher = await OV.initPublisher(undefined, {
              audioSource: undefined,
              videoSource: false,
              publishAudio: true,
              publishVideo: false,
            });

            await initialSession.publish(initialPublisher);
            console.log('스트림 발행 완료');
            setPublisher(initialPublisher);
          }

          setSession(initialSession);
        } catch (error) {
          console.error('음성 채팅 초기화 오류:', error);
          setConnectionStatus('error');
        }
      };

      initializeVoiceChat();
    }

    return () => {
      if (session) {
        if (publisher) {
          session.unpublish(publisher);
        }
        session.disconnect();
        setConnectionStatus('disconnected');
        setSession(null);
        setPublisher(null);
      }
    };
  }, [roomId, participantNo, nickname, gameState?.roomStatus, gameState?.participant]);

  // 플레이어가 죽었을 때 음성 전송 중지
  useEffect(() => {
    if (publisher && gameState?.participant[nickname]) {
      const isDead = gameState.participant[nickname].isDead ?? false;
      if (isDead) {
        session?.unpublish(publisher);
        setPublisher(null);
      }
      setIsMuted(isDead);
    }
  }, [gameState?.participant, nickname, publisher, session]);

  if (gameState?.roomStatus !== 'PLAYING') {
    return null;
  }

  const toggleMute = () => {
    if (publisher && !gameState?.participant[nickname]?.isDead) {
      const newMuteState = !isMuted;
      publisher.publishAudio(!newMuteState);
      setIsMuted(newMuteState);
    }
  };

  // 죽은 플레이어는 버튼을 보여주지 않음
  if (gameState?.participant[nickname]?.isDead) {
    return null;
  }

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
