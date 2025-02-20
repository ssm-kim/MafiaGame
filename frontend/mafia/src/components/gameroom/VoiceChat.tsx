import { useEffect, useState } from 'react';
import { OpenVidu, Publisher, Session, StreamManager, Subscriber } from 'openvidu-browser';
import OpenViduVideoComponent from './OvVideo';

interface VoiceChatProps {
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

function VoiceChat({ nickname, gameState }: VoiceChatProps) {
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
    function onbeforeunload() {
      leaveSession();
    }
    window.addEventListener('beforeunload', () => onbeforeunload());
    return () => {
      window.removeEventListener('beforeunload', () => onbeforeunload());
    };
  }, []);

  useEffect(() => {
    if (gameState && gameState.myInfo) {
      const initializeVoiceChat = async () => {
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
            const index = prevsubscribers.indexOf(event.stream.streamManager as Subscriber, 0);
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
                  videoSource: undefined,
                  publishAudio: true,
                });
                newsession.publish(newpublisher);
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
      //
    };
  }, [gameState?.myInfo]);

  if (gameState?.roomStatus !== 'PLAYING' || !gameState.myInfo) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <div>
        {publisher !== undefined ? (
          <div className="stream-container col-md-6 col-xs-6">
            <OpenViduVideoComponent streamManager={publisher as StreamManager} />
          </div>
        ) : null}
        {subscribers.map((sub) => (
          <div
            key={sub.id}
            className="stream-container col-md-6 col-xs-6"
          >
            <span>{sub.id}</span>
            <OpenViduVideoComponent streamManager={sub as StreamManager} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default VoiceChat;
