import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import SocketService from '@/game/socket/SocketService';

import PreLoaderScene from '@/game/scenes/PreLoaderScene';
import MainScene from '@/game/scenes/MainScene';
import NightScene from '@/game/scenes/NightScene';
import VoteScene from '@/game/scenes/VoteScene';

function GameComponent() {
  const gameContainer = useRef(null);
  const gameInstance = useRef(null);

  const preventClose = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    window.addEventListener('beforeunload', preventClose);
    return () => {
      window.removeEventListener('beforeunload', preventClose);
    };
  }, []);

  useEffect(() => {
    if (gameContainer.current) {
      const socketService = new SocketService('http://192.168.100.181:3000');

      const config = {
        type: Phaser.CANVAS,
        parent: gameContainer.current,
        pixelArt: true,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%',
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
          },
        },
        callbacks: {
          preBoot: (game) => {
            game.registry.set('socketService', socketService);
          },
        },
        scene: [PreLoaderScene, MainScene, NightScene, VoteScene],
        plugins: {
          scene: [
            {
              key: 'rexUI',
              plugin: UIPlugin,
              mapping: 'rexUI',
            },
          ],
        },
      };

      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      gameInstance.current.destroy(true);
    };
  }, []);

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
  );
}

export default GameComponent;
