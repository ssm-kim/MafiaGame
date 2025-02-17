import Phaser from 'phaser';
import GamePhases from '@/types/game';
import sceneChanger from '@/game/utils/sceneChange';
import setBackground from '@/game/utils/map';

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  init() {
    this.gameData = this.registry.get('gameData');
    this.gameStatus = this.registry.get('gameStatus');
  }

  preload() {
    const assetsBasePath = '/game/images';
    this.load.image('background', `${assetsBasePath}/maps/classroom.png`);

    this.load.spritesheet('character1', `${assetsBasePath}/characters/character1.png`, {
      frameWidth: 32,
      frameHeight: 60,
    });
    this.load.spritesheet('character2', `${assetsBasePath}/characters/character2.png`, {
      frameWidth: 32,
      frameHeight: 60,
    });
    this.load.spritesheet('character3', `${assetsBasePath}/characters/character3.png`, {
      frameWidth: 32,
      frameHeight: 60,
    });
    this.load.spritesheet('character4', `${assetsBasePath}/characters/character4.png`, {
      frameWidth: 32,
      frameHeight: 60,
    });
    this.load.spritesheet('character5', `${assetsBasePath}/characters/character5.png`, {
      frameWidth: 32,
      frameHeight: 60,
    });
  }

  createAnims() {
    for (let i = 1; i <= 5; i += 1) {
      this.anims.create({
        key: `character${i}_left`,
        frames: this.anims.generateFrameNumbers(`character${i}`, { start: 3, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `character${i}_right`,
        frames: this.anims.generateFrameNumbers(`character${i}`, { start: 9, end: 11 }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `character${i}_up`,
        frames: this.anims.generateFrameNumbers(`character${i}`, { start: 6, end: 8 }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `character${i}_down`,
        frames: this.anims.generateFrameNumbers(`character${i}`, { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  create() {
    this.createAnims();
    setBackground(this);
    const socketService = this.registry.get('socketService');
    const eventEmitter = this.registry.get('eventEmitter');

    this.roomId = this.registry.get('roomId');

    this.scene.get('SceneManager').loadSceneData('MainScene');
    socketService.subscribeToRoom((positions) => {
      eventEmitter.emit('PLAYER_DATA_UPDATED', positions);
    });

    // this.handleEvents();
    sceneChanger(this);
    // this.scene.start('MainScene');
  }

  // handleEvents() {
  // const eventEmitter = this.registry.get('eventEmitter');
  // eventEmitter.on('VOTE_RESULT', (data) => {
  //   console.log(data);
  //   if (data.voteResult !== -1) {
  //     this.scene.start('StatementScene', data);
  //   } else {
  //     this.scene.start('NightScene');
  //   }
  // });
  // console.log(eventEmitter);
  // eventEmitter.on('TIME', (data) => {
  //   try {
  //     const parsedData = JSON.parse(data);  // 문자열을 JSON 객체로 변환
  //     console.log(parsedData);  // time 값 출력
  //   } catch (error) {
  //     console.error("Error parsing JSON:", error);
  //   }
  // });
  // }
}
