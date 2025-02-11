import { useEffect, useRef } from 'react';
import { Client as StompClient, StompSubscription } from '@stomp/stompjs';

const endpoints = {
  Chatting: '/ws-mafia',
  PlayerPostion: '/mafia-game-ws',
};

const useWebSocket = () => {
  const chattingSocket = useRef<StompClient | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);

  useEffect(() => {
    if (!chattingSocket.current) {
      const socket = new WebSocket(endpoints.Chatting);
      const stompClient = new StompClient({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log('Chatting WebSocket Connected');
          stompClient.subscribe();
        },
      });

      chattingSocket.current = stompClient;
    }

    return () => {
      if (chattingSocket.current) {
        chattingSocket.current.deactivate();
        chattingSocket.current = null;
      }
    };
  }, []);

  const subscribeToTopic = (newTopics, onReceiveMessage) => {
    if (!chattingSocket.current || !chattingSocket.current.connected) {
      console.warn('Chatting WebSocket이 아직 연결되지 않음');
      return;
    }

    if (subscriptionsRef.current) {
      subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
      subscriptionsRef.current = [];
    }

    newTopics.forEach(() => {
      console.log(`'${newTopic}' 구독 시작`);

      const newSubscription = chattingSocket.current.subscribe(newTopic, (message) => {
        console.log(`Message from ${newTopic}:`, JSON.parse(message.body));
        onReceiveMessage(message.body);
      });

      subscriptionsRef.current.push(newSubscription);
    });
  };

  return {
    chattingSocket: chattingSocket.current,
    subscribeToTopic,
  };
};

export default useWebSocket;
