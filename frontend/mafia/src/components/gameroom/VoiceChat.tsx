import { useEffect, useState, useRef, useCallback } from 'react';
import {
  OpenVidu,
  Publisher,
  Session,
  StreamManager,
  Subscriber,
  PublisherProperties,
} from 'openvidu-browser';
import AudioComponent from './AudioComponent';

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
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const leaveSession = () => {
    session?.disconnect();
    setSession(null);
    setPublisher(null);
    setSubscribers([]);
  };

  useEffect(() => {
    function onbeforeunload(event) {
      leaveSession();
    }
    window.addEventListener('beforeunload', onbeforeunload);
    return () => {
      window.removeEventListener('beforeunload', onbeforeunload);
    };
  }, []);

  useEffect(() => {
    if (gameState.myInfo) {
      const initializeVoiceChat = () => {
        if (!gameState.myInfo) return;

        try {
          const OV = new OpenVidu();
          OV.enableProdMode();

          const token = gameState.myInfo.openviduToken;
          if (!token) {
            throw new Error('OpenVidu token not found');
          }

          const newsession = OV.initSession();

          newsession.on('streamCreated', (event) => {
            const subscriber = newsession.subscribe(event.stream, undefined);
            console.log('Subscriber created:', subscriber);
            setSubscribers((prev) => [...prev, subscriber]);
          });

          newsession.on('streamDestroyed', (event) => {
            const prevsubscribers = subscribers;
            const index = prevsubscribers.indexOf(event.stream.streamManager, 0);
            if (index > -1) {
              prevsubscribers.splice(index, 1);
              setSubscribers(prevsubscribers);
            }
          });

          // On every asynchronous exception...
          newsession.on('exception', (exception) => {
            console.warn(exception);
          });

          newsession
            .connect(token, {
              clientData: JSON.stringify({
                nickname,
                role: gameState.myInfo.role,
                isDead: gameState.myInfo.isDead,
              }),
            })
            .then(async () => {
              try {
                const newpublisher = await OV.initPublisherAsync(undefined, {
                  audioSource: undefined,
                  videoSource: false,
                  publishAudio: gameState?.myInfo?.muteAudio,
                });
                await newsession.publish(newpublisher);
                setPublisher(newpublisher);
              } catch (error) {
                console.error('Error connecting to the session:', error);
              }

              console.log('Publish Created');
            });

          setSession(newsession);
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
  }, [gameState?.myInfo]);

  if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <div style={{ display: 'none' }}>
        {publisher && <AudioComponent streamManager={publisher} />}
        {subscribers.map((sub, i) => (
          <AudioComponent
            key={i}
            streamManager={sub}
          />
        ))}
      </div>
    </div>
  );
}

export default VoiceChat;
