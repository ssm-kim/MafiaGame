import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useParams } from 'react-router-dom';
// import SocketService from '@/game/socket/SocketService';

import GameAPIFactory from '@/api/gameApiFactory';
import gameConfig from '@/game/gameConfig';
import usePlayerPostionSocket from '@/hooks/usePlayerPostionSocket';

function GameComponent() {
  const roomId = useParams();
  const [userId, setUserId] = useState(null);

  const gameContainer = useRef(null);
  const gameInstance = useRef(null);

  const socketService = usePlayerPostionSocket(roomId);
  const eventEmitter = new Phaser.Events.EventEmitter();

  const preventClose = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    setUserId(prompt('유저 아이디 입력 (숫자 1~8)'));
    window.addEventListener('beforeunload', preventClose);
    return () => {
      window.removeEventListener('beforeunload', preventClose);
    };
  }, []);

  useEffect(() => {
    if (gameContainer.current && userId && socketService.playerPostionSocket) {
      const gameAPI = GameAPIFactory.create();

      const config = gameConfig({
        parent: gameContainer.current,
        socketService,
        gameAPI,
        roomId,
        userId,
        eventEmitter,
      });

      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      gameInstance.current?.destroy(true);
      socketService.disconnect();
    };
  }, [gameContainer?.current, userId, socketService.playerPostionSocket]);

  useEffect(() => {
    let resizeObserver;

    if (gameContainer.current && gameInstance.current) {
      // ResizeObserver를 생성하여 크기 변경 감지
      resizeObserver = new ResizeObserver(() => {
        const { width, height } = gameContainer.current.getBoundingClientRect();
        gameInstance.current.scale.resize(width, height);
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
    // <div
    //   id="game-container"
    //   ref={gameContainer}
    //   style={{
    //     position: 'relative',
    //     width: '100%',
    //     height: '100%',
    //     overflow: 'hidden',
    //   }}
    // />
    <>
      {' '}
      {userId ? (
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
