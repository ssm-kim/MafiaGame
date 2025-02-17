import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useParams } from 'react-router-dom';
// import SocketService from '@/game/socket/SocketService';

import GameAPIFactory from '@/api/gameApiFactory';
import gameConfig from '@/game/gameConfig';
import usePlayerPostionSocket from '@/hooks/usePlayerPostionSocket';
import useChattingSocket from '@/hooks/useChattingSocket';

function GameComponent() {
  const { roomId } = useParams();
  const [userId, setUserId] = useState(null);

  const gameContainer = useRef(null);
  const gameInstance = useRef(null);

  const [eventEmitter, setEventEmitter] = useState(null);

  const positinoSocketService = usePlayerPostionSocket(roomId);

  const chattingSocketService = useChattingSocket(roomId, eventEmitter);

  useEffect(() => {}, []);

  const preventClose = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    if (chattingSocketService.isConnected) {
      chattingSocketService.subscribeToTopic([
        {
          topic: `/topic/game-${roomId}-system`,
          onReceiveMessage: (message) => {
            try {
              // 받은 메시지가 JSON 문자열이라면 파싱
              const parsedMessage = JSON.parse(message);

              // 파싱한 데이터로 분기 처리
              if (parsedMessage.phase) {
                eventEmitter.emit('TIME', parsedMessage);
              } else if (parsedMessage.voteresult) {
                eventEmitter.emit('VOTE_RESULT', parsedMessage.voteresult);
              }
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          },
        },
      ]);
    }
  }, [chattingSocketService.isConnected]);

  useEffect(() => {
    setEventEmitter(new Phaser.Events.EventEmitter());

    console.log(chattingSocketService);
    setUserId(prompt('유저 아이디 입력 (숫자 1~8)'));
    window.addEventListener('beforeunload', preventClose);
    return () => {
      window.removeEventListener('beforeunload', preventClose);
    };
  }, []);

  useEffect(() => {
    if (gameContainer.current && userId && positinoSocketService.playerPostionSocket) {
      const gameAPI = GameAPIFactory.create();

      const config = gameConfig({
        parent: gameContainer.current,
        socketService: positinoSocketService,
        gameAPI,
        roomId,
        userId,
        eventEmitter,
      });

      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      gameInstance.current?.destroy(true);
      positinoSocketService.disconnect();
    };
  }, [gameContainer?.current, userId, positinoSocketService.playerPostionSocket]);

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
      {/* <button
        onClick={() => {
          eventEmitter.emit('VOTE_RESULT', { targetPlayerId: 7 });
        }}
      >
        CLICK
      </button> */}
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
