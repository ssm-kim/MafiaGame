import axios from 'axios';
import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import PlayerManager from '@/game/player/PlayerManager';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
import showFixedClock from '@/game/ui/clock/BaseClock';
import BGMController from '@/game/utils/BGMController';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'MainScene',
    });

    this.players = new Map();
    // this.remainingTime = sceneTimeout.DAY_DISCUSSION;
  }

  init() {
    this.gameData = this.registry.get('gameData');
    this.playerInfo = this.registry.get('playerInfo');  
    this.roomId = this.registry.get('roomId');

    this.socketService = this.registry.get('socketService');
    this.playerManager = new PlayerManager(this, this.playerInfo);
  }

  create() {
    // 배경 설정
    setBackground(this);
    showFixedClock(this);
    showFixedRoleText(this);
    sceneChanger(this);
    // bgm
    this.bgmController = new BGMController(this);
    this.bgmController.playBGM('afternoon_bgm');
    // 렌더링 최적화
    this.game.renderer.roundPixels = true;
  }

  update() {
    // 로컬 플레이어 업데이트
    if (this.playerManager.localPlayer) {
      this.playerManager.localPlayer.move();
    }
  }

  shutdown() {
    if (this.bgmController) {
      this.bgmController.stop();
    }
    // 추가적인 정리
    if (this.registry.get('currentBGM')) {
        this.registry.get('currentBGM').stop();
        this.registry.remove('currentBGM');
    }
  }

  destroy() {
    if (this.bgmController) {
        this.bgmController.stop();
    }
    super.destroy();
  }
}
