import Phaser from 'phaser';
import axios from 'axios';
import PlayerRole from '@/types/role';
import getRandomCharacter from '@/game/utils/character';
import sceneChanger from '@/game/utils/time';

export default class SceneManager extends Phaser.Scene {
  constructor() {
    super({ key: 'SceneManager' });
  }

  init() {
    this.roomId = this.registry.get('roomId');
    this.userId = this.registry.get('userId');
    this.getgameData();
    this.loadSceneData('LoadingScene');
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

  create() {
    sceneChanger(this);
    this.createAnims();
  }

  async getgameData() {
    try {
      const response = await axios.get('http://localhost:8080/api/game/2', {
        withCredentials: true, // 쿠키 포함 옵션
      });

      console.log('게임 데이터:', response.data);

      // response.data를 registry에 저장
      this.registry.set('gameData', response.data);

      return response.data;
    } catch (error) {
      console.error('게임 데이터를 불러오는 중 오류 발생:', error.message);
      return null;
    }
  }

  async loadSceneData(nextSceneName) {
    try {
      this.gameAPI = this.registry.get('gameAPI');
      await this.loadGameData();

      if (nextSceneName === 'NightScene') {
        const isEnd = await this.gameAPI.getGameEndState();

        if (isEnd.result.ex !== 'PLAYING') {
          this.scene.start('GameOverScene');
          return;
        }
      }

      this.setPlayerData();

      // 다음 씬 시작
      // this.scene.start(nextSceneName);
    } catch (error) {
      // console.error('Failed to load game data:', error);
      // 에러 처리
    }
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

  async loadGameData() {
    const gameData = await this.gameAPI.getGameData();
    const gameStatus = await this.gameAPI.getGameStatus();

    // 데이터 저장
    this.gameData = gameData;
    this.gameStatus = gameStatus;

    // 데이터를 레지스트리에 저장
    this.registry.set('gameData', gameData);
    this.registry.set('gameStatus', gameStatus);
  }

  async setPlayerData() {
    // 플레이어 데이터 레지스트리에 저장
    this.playerInfo = this.gameData.result.players[this.userId];

    const newPlayerInfo = {
      ...this.playerInfo,
      role: PlayerRole[this.playerInfo.role],
      character: getRandomCharacter(),
    };

    delete newPlayerInfo.userId;

    this.registry.set('playerInfo', newPlayerInfo);
  }
}
