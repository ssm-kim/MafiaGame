import Phaser from 'phaser';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import GameOverScene from '@/game/scenes/GameOverScene';
import MainScene from '@/game/scenes/MainScene';
import StartScene from '@/game/scenes/StartScene';
import VoteScene from './scenes/VoteScene';
import StatementScene from '@/game/scenes/StatementScene';
import LastVoteScene from '@/game/scenes/LastVoteScene';
import AfternoonScene from '@/game/scenes/AfternoonScene';
import SceneManager from '@/game/scenes/SceneManager';
import NightScene from '@/game/scenes/NightScene';

const scenes = [
  SceneManager,
  // StartScene,
  MainScene,
  NightScene,
  VoteScene,
  StatementScene,
  LastVoteScene,
  GameOverScene,
  AfternoonScene,
];

const gameConfig = ({
  parent,
  stompClient,
  roomId,
  playerNo,
  eventEmitter,
  setSubscriptions,
  setShowGame,
}) => ({
  type: Phaser.WEBGL,
  parent,
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
      game.registry.set('stompClient', stompClient);
      game.registry.set('eventEmitter', eventEmitter);
      game.registry.set('roomId', roomId);
      game.registry.set('playerNo', playerNo);
      game.registry.set('setSubscriptions', setSubscriptions);
      game.registry.set('setShowGame', setShowGame);
    },
  },
  scene: scenes,
  plugins: {
    scene: [
      {
        key: 'rexUI',
        plugin: UIPlugin,
        mapping: 'rexUI',
      },
    ],
  },
});

export default gameConfig;
