import Phaser from 'phaser';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import GameOverScene from '@/game/scenes/GameOverScene';
import MainScene from '@/game/scenes/MainScene';
// import LoadingScene from '@/game/scenes/LoadingScene';
import StartScene from '@/game/scenes/StartScene';
import VoteScene from '@/game/scenes/VoteScene';
import StatementScene from '@/game/scenes/StatementScene';
import LastVoteScene from '@/game/scenes/LastVoteScene';
import AfternoonScene from '@/game/scenes/AfternoonScene';
import SceneManager from '@/game/scenes/SceneManager';
import SocketService from '@/game/socket/SocketService';
import GameAPI from '@/interfaces/gameApi';
import NightScene from '@/game/scenes/NightScene';

const scenes = [
  SceneManager,
  // LoadingScene,
  StartScene,
  MainScene,
  NightScene,
  VoteScene,
  StatementScene,
  LastVoteScene,
  GameOverScene,
  AfternoonScene,
];

interface GameConfigParams {
  parent?: HTMLDivElement;
  socketService: SocketService;
  gameAPI: GameAPI;
  roomId: string;
  userId: string;
  eventEmitter: Phaser.Events.EventEmitter;
}

const gameConfig = ({
  parent,
  socketService,
  gameAPI,
  roomId,
  userId,
  eventEmitter,
}: GameConfigParams) => ({
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
      game.registry.set('socketService', socketService);
      game.registry.set('eventEmitter', eventEmitter);
      game.registry.set('gameAPI', gameAPI);
      game.registry.set('roomId', roomId);
      game.registry.set('userId', userId);
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
