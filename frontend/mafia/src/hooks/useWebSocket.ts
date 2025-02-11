import { useEffect } from 'react';
import { Stomp, Client as StompClient } from '@stomp/stompjs';

const endpoints = {
  Chatting: '/ws-mafia',
  PlayerPostion: '/mafia-game-ws',
};

const useWebSocket = () => {
  const chattingSocket = useRef<StompClient | null>(null);
  const playerPostionSocket = useRef<StompClient | null>(null);

  useEffect(() => {
    if (!chattingSocket.current) {
      const socket = new WebSocket(endpoints.Chatting);
      const stompClient = new StompClient({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log('Chatting WebSocket Connected');
        },
      });
      chattingSocket.current = stompClient;
    }
    if (!playerPostionSocket.current) {
      const socket = new WebSocket(endpoints.PlayerPostion);
      const stompClient = Stomp.over(socket);

      playerPostionSocket.current = stompClient;
    }

    return () => {
      if (chattingSocket.current) {
        chattingSocket.current.deactivate();
        chattingSocket.current = null;
      }
      if (playerPostionSocket.current) {
        playerPostionSocket.current.deactivate();
        playerPostionSocket.current = null;
      }
    };
  }, []);

  return {
    chattingSocket: chattingSocket.current,
    playerPostionSocket: playerPostionSocket.current,
  };
};

export default useWebSocket;
