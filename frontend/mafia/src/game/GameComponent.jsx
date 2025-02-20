import { useEffect, useRef, useState } from 'react';
import Phaser, { Game } from 'phaser';
// import SocketService from '@/game/socket/SocketService';

import { CompatClient, StompSubscription } from '@stomp/stompjs';
import gameConfig from '@/game/gameConfig';

function GameComponent({
  roomId,
  playerNo,
  stompClient,
  eventEmitter,
  setSubscriptions,
  setShowGame,
}) {
  const gameContainer = useRef(null);
  const gameInstance = useRef(null);
  const [positionSubscription, setPositionSubscription] = useState(null);

  const preventClose = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    if (stompClient?.connected) {
      const subscription = stompClient?.subscribe(`/topic/game/${roomId}/positions`, (message) => {
        const data = JSON.parse(message.body);
        eventEmitter.emit('PLAYER_DATA_UPDATED', data);
      });

      setPositionSubscription(subscription);
    }

    return () => {
      positionSubscription?.unsubscribe();
    };
  }, [stompClient]);

  useEffect(() => {
    window.addEventListener('beforeunload', preventClose);
    return () => {
      window.removeEventListener('beforeunload', preventClose);
    };
  }, []);

  useEffect(() => {
    if (gameContainer.current && playerNo) {
      const config = gameConfig({
        parent: gameContainer.current,
        stompClient,
        roomId,
        playerNo,
        eventEmitter,
        setSubscriptions,
        setShowGame,
      });

      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      gameInstance.current?.destroy(true);
    };
  }, [gameContainer?.current, playerNo]);

  useEffect(() => {
    let resizeObserver;

    if (gameContainer.current && gameInstance.current) {
      // ResizeObserver를 생성하여 크기 변경 감지
      resizeObserver = new ResizeObserver(() => {
        const { width, height } = gameContainer.current.getBoundingClientRect();
        gameInstance.current?.scale.resize(width, height);
      });

      // ResizeObserver로 컨테이너 관찰 시작
      resizeObserver.observe(gameContainer.current);
    }

    return () => {
      // ResizeObserver 정리
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <>
      {' '}
      {playerNo ? (
        <div
          id="game-container"
          ref={gameContainer}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        />
      ) : null}
    </>
  );
}

export default GameComponent;
