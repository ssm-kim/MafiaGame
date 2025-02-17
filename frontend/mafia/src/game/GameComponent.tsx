import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
// import SocketService from '@/game/socket/SocketService';

import { CompatClient } from '@stomp/stompjs';
import GameAPIFactory from '@/api/gameApiFactory';
import gameConfig from '@/game/gameConfig';

interface GameComponentProps {
  roomId: string;
  playerId: string;
  stompClient: CompatClient | null;
  eventEmitter: Phaser.Events.EventEmitter;
  subscribeTopics: any;
}

function GameComponent({
  roomId,
  playerId,
  stompClient,
  eventEmitter,
  subscribeTopics,
}: GameComponentProps) {
  const gameContainer = useRef(null);
  const gameInstance = useRef(null);

  useEffect(() => {}, []);

  const preventClose = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    if (stompClient?.connected) {
      const positionSubscription = stompClient?.subscribe(
        `/topic/game/${roomId}/positions`,
        (message) => {
          const data = JSON.parse(message.body);
          eventEmitter.emit('PLAYER_DATA_UPDATED', data);
        },
      );
    }

    return () => {
      positionSubscription?.unsubscribe();
    };
  }, [stompClient]);

  // useEffect(() => {
  //   if (chattingSocketService.isConnected) {
  //     chattingSocketService.subscribeToTopic([
  //       {
  //         topic: `/topic/game-${roomId}-system`,
  //         onReceiveMessage: (message) => {
  //           try {
  //             // 받은 메시지가 JSON 문자열이라면 파싱
  //             const parsedMessage = JSON.parse(message);

  //             // 파싱한 데이터로 분기 처리
  //             if (parsedMessage.phase) {
  //               eventEmitter.emit('TIME', parsedMessage);
  //             } else if (parsedMessage.voteresult) {
  //               eventEmitter.emit('VOTE_RESULT', parsedMessage.voteresult);
  //             }
  //           } catch (error) {
  //             console.error('Error parsing message:', error);
  //           }
  //         },
  //       },
  //     ]);
  //   }
  // }, [chattingSocketService.isConnected]);

  useEffect(() => {
    window.addEventListener('beforeunload', preventClose);
    return () => {
      window.removeEventListener('beforeunload', preventClose);
    };
  }, []);

  useEffect(() => {
    if (gameContainer.current && playerId) {
      const gameAPI = GameAPIFactory.create();

      const config = gameConfig({
        parent: gameContainer.current,
        stompClient,
        gameAPI,
        roomId,
        userId: playerId,
        eventEmitter,
      });

      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      gameInstance.current?.destroy(true);
    };
  }, [gameContainer?.current, playerId]);

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
    <>
      {' '}
      {playerId ? (
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
