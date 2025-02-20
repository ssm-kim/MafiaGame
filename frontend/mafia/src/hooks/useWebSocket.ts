import { useEffect, useRef, useState } from 'react';
import { Stomp, CompatClient } from '@stomp/stompjs';
import useChatting from './useChatting';
import useRoom from './useRoomSocket';

const useWebSocket = (roomId: number) => {
  const stompClient = useRef<CompatClient | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const chatting = useChatting(stompClient, roomId);
  const room = useRoom(stompClient, roomId);

  useEffect(() => {
    if (!stompClient.current?.connected);

    const socket = new WebSocket('ws://localhost:8080/ws-mafia');
    const newStompClient = Stomp.over(() => socket);

    newStompClient.debug = () => {};

    newStompClient.connect({}, () => {
      setIsConnected(true);
    });

    stompClient.current = newStompClient;

    return () => {
      if (stompClient.current)
        stompClient.current.disconnect(() => {
          setIsConnected(false);
        });
    };
  }, []);

  return {
    stompClient: stompClient.current,
    isConnected,
    chatting,
    room,
  };
};

export default useWebSocket;
