import { useEffect, useRef, useState } from 'react';
import { Stomp, Client as StompClient, StompSubscription } from '@stomp/stompjs';

const endpoints = {
  Chatting: '/ws-mafia',
  PlayerPostion: '/mafia-game-ws',
};

interface Topic {
  topic: string;
  onReceiveMessage: (message: string) => void;
}

const useChattingSocket = () => {
  const chattingSocket = useRef<StompClient | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!chattingSocket.current) {
      const socket = new WebSocket(`ws://localhost:8080${endpoints.Chatting}`);
      const stompClient = Stomp.over(socket);

      stompClient.debug = () => {};

      stompClient.connect({}, () => {
        setIsConnected(true);
      });

      chattingSocket.current = stompClient;
    }

    return () => {
      if (chattingSocket.current) {
        chattingSocket.current = null;
      }
    };
  }, []);

  /**
   * @param newTopic 구독할 topic과 메시지 수신 시 실행할 콜백 함수
   */
  const subscribeToTopic = (newTopics: Topic[]) => {
    if (!chattingSocket.current || !chattingSocket.current.connected) {
      console.warn('Chatting WebSocket이 아직 연결되지 않음');
      return;
    }

    if (subscriptionsRef.current) {
      subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
      subscriptionsRef.current = [];
    }

    newTopics.forEach((newTopic) => {
      const newSubscription = chattingSocket.current.subscribe(newTopic.topic, (message) => {
        newTopic.onReceiveMessage(message.body);
      });

      subscriptionsRef.current.push(newSubscription);
    });
  };

  return {
    chattingSocket: chattingSocket.current,
    subscribeToTopic,
    isConnected,
  };
};

export default useChattingSocket;
