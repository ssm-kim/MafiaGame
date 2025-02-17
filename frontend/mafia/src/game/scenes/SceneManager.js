import Phaser from 'phaser';
import PlayerRole from '@/types/role';
import getRandomCharacter from '@/game/utils/character';

export default class SceneManager extends Phaser.Scene {
  constructor() {
    super({ key: 'SceneManager' });
  }

  async init() {
    this.roomId = this.registry.get('roomId');
    this.userId = this.registry.get('userId');
    await this.loadSceneData(this, 'LoadingScene');
  }

  async loadSceneData(scene, nextSceneName) {
    console.log(scene);

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
      const roomId = this.registry.get('roomId'); // registry에서 roomId 가져오기
      const response = await axios.get(`http://localhost:8080/api/game/${roomId}`, {
        withCredentials: true,
      });
  
      if (!response.data.isSuccess) {
        throw new Error(response.data.message);
      }
  
      console.log('게임 데이터:', response.data);
      this.registry.set('gameData', response.data);
      return response.data;
    } catch (error) {
      console.error('게임 데이터를 불러오는 중 오류 발생:', error.message);
      // 에러 처리 로직 추가
      return null;
    }
  }

  async loadSceneData(nextSceneName) {
    try {
      this.gameAPI = this.registry.get('gameAPI');
      await this.loadGameData(this.gameAPI);

      if (nextSceneName === 'NightScene') {
        const isEnd = await this.gameAPI.getGameEndState();

        if (isEnd.result.ex !== 'PLAYING') {
          scene.scene.start('GameOverScene');
          return;
        }
      }

      this.setPlayerData();

      // 다음 씬 시작
      scene.scene.start(nextSceneName);
    } catch (error) {
      console.error('Failed to load game data:', error);
      // 에러 처리
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
