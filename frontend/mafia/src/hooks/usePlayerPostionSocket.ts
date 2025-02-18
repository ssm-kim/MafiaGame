import { useEffect, useRef } from 'react';
import { Client as StompClient } from '@stomp/stompjs';

const endpoints = {
  Chatting: '/ws-mafia',
  PlayerPostion: '/mafia-game-ws',
};

const usePlayerPostionSocket = (roomId) => {
  const playerPostionSocket = useRef<StompClient | null>(null);

  useEffect(() => {
    if (!playerPostionSocket.current) {
      const socket = new WebSocket(`ws://localhost:8080${endpoints.PlayerPostion}`);
      const stompClient = new StompClient({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log('PlayerPostion WebSocket Connected');
        },
      });
      // stompClient.activate();
      playerPostionSocket.current = stompClient;
    }

    return () => {
      if (playerPostionSocket.current) {
        playerPostionSocket.current.deactivate();
        playerPostionSocket.current = null;
      }
    };
  }, []);

  const subscribeToRoom = (onReceiveMessage) => {
    if (!playerPostionSocket.current || !playerPostionSocket.current.connected) {
      console.warn('PlayerPostion WebSocket이 아직 연결되지 않음');
      return;
    }

    playerPostionSocket.current.subscribe(`/topic/game/${roomId}/positions`, (message) => {
      const positions = JSON.parse(message.body);
      onReceiveMessage(positions);
    });
  };

  const sendPosition = (playerData: PlayerData) => {
    if (playerPostionSocket.current && playerPostionSocket.current.connected) {
      const data = {
        character: playerData.character,
        x: playerData.x,
        y: playerData.y,
        velocityX: playerData.velocityX,
        velocityY: playerData.velocityY,
        lastDirection: playerData.lastDirection,
      };

      playerPostionSocket.current.send(`/app/game/${roomId}/pos`, {}, JSON.stringify(data));
    }
  };

  const disconnect = () => {
    playerPostionSocket.current?.deactivate();
  };

  return {
    playerPostionSocket: playerPostionSocket.current,
    subscribeToRoom,
    sendPosition,
    disconnect,
  };
};

export default usePlayerPostionSocket;
