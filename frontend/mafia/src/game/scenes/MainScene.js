import axios from 'axios';
import setBackground from '@/game/utils/map';
import BaseScene from '@/game/scenes/BaseScene';
import PlayerManager from '@/game/player/PlayerManager';
import { sceneTimeout } from '@/game/utils/time';

export default class MainScene extends BaseScene {
  constructor() {
    super({
      key: 'MainScene',
      // physics: {
      //   arcade: {
      //     debug: true,
      //   },
      // },
    });

    this.players = new Map();
    this.remainingTime = sceneTimeout.DAY_DISCUSSION;
  }

  init() {
    const playerInfo = this.registry.get('playerInfo');
    this.roomId = this.registry.get('roomId');

    const { role, character } = playerInfo;
    this.role = role;
    this.character = character;

    this.socketService = this.registry.get('socketService');
    this.playerManager = new PlayerManager(this, playerInfo);
  }

  create() {
    this.time.addEvent({
      delay: this.remainingTime,
      callback() {
        this.scene.get('SceneManager').loadSceneData('VoteScene');
        this.scene.stop('MainScene');
        // this.scene.start('VoteScene');
      },
      callbackScope: this,
    });

    // 배경 설정
    setBackground(this);

    this.showFixedRoleText();

    // 렌더링 최적화
    this.game.renderer.roundPixels = true;

    // 타이머 표시용 텍스트 추가
    const duration = 30;

    this.add
      .text(this.cameras.main.width - 150, 10, `남은 시간: ${duration}`, {
        font: '18px Arial',
        fill: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
      })
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('NightScene');
      }); // 카메라 고정
  }

  async getgameData() {
    try {
      // 응답 성공
      const response = await axios.get(`http://localhost:8080/api/game/2`);
      console.log(response);
    } catch (error) {
      // 응답 실패
      console.error(error);
    }
  }

  update() {
    // 로컬 플레이어 업데이트
    if (this.playerManager.localPlayer) {
      this.playerManager.localPlayer.move();
    }
  }

  showFixedRoleText() {
    // 역할에 따라 문구 색상 설정
    const textColor = this.role === '마피아' ? '#ff0000' : '#ffffff';

    // 좌측 상단에 역할 문구 표시
    this.fixedRoleText = this.add.text(10, 10, `${this.role}`, {
      font: '18px Arial',
      fill: textColor,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: { left: 5, right: 5, top: 5, bottom: 2 },
    });

    // 문구를 화면 좌측 상단에 고정
    this.fixedRoleText.setScrollFactor(0);
  }
}
