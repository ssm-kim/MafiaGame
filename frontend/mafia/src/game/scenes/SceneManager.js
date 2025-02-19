import Phaser from 'phaser';
import sceneChanger from '@/game/utils/sceneChange';
import { getGameData } from '@/game/utils/gameData';

export default class SceneManager extends Phaser.Scene {
  constructor() {
    super({ key: 'SceneManager' });
  }

  init() {
    this.roomId = this.registry.get('roomId');
    this.userId = this.registry.get('userId');
    getGameData(this);
    // 플레이어 정보 초기화
    const randomCharacter = `character${Math.floor(Math.random() * 5) + 1}`;
    const playerInfo = {
        nickname: this.registry.get('nickname'),
        character: randomCharacter,
        // 다른 필요한 정보들...
    };
    this.registry.set('playerInfo', playerInfo);

    // BGM 음소거 상태 초기화
    if (this.registry.get('bgmMuted') === undefined) {
      this.registry.set('bgmMuted', false);
    }
  }

  preload() {
    const assetsBasePath = '/game/images';
    const bgmassets = '/game/bgms';
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
    this.load.audio('afternoon_bgm', `${bgmassets}/afternoon_bgm.mp3`);
    this.load.audio('night_bgm', `${bgmassets}/nightscene_bgm.mp3`);
    this.load.audio('vote_bgm', `${bgmassets}/vote_bgm.mp3`);
  }

  create() {
    sceneChanger(this);
    this.createAnims();
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
}
