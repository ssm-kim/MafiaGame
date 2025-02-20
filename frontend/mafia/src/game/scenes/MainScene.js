import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import PlayerManager from '@/game/player/PlayerManager';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
import showFixedClock from '@/game/ui/clock/BaseClock';
import getGameData from '@/game/utils/gameData';
import BGMController from '@/game/utils/BGMController';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'MainScene',
    });

    this.players = new Map();
  }

  init() {
    getGameData(this);

    this.roomId = this.registry.get('roomId');
    this.socketService = this.registry.get('socketService');
    this.playerManager = new PlayerManager(this);
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

    this.showRole();
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

  showRole() {
    const message = this.registry.get('afternoonMessage');
    const { role } = this.registry.get('playerInfo');
    const mainCam = this.cameras.main;

    mainCam.fadeIn(1000, 0, 0, 0);

    const overlay = this.add.rectangle(
      mainCam.width / 2,
      mainCam.height / 2,
      mainCam.width,
      mainCam.height,
      0x000000,
    );

    const roleText = this.add
      .text(mainCam.width / 2, mainCam.height / 2, message || `당신은 ${role}입니다.`, {
        font: '28px Arial',
        fill: role === '감염자' || message ? '#ff0000' : '#ffffff',
        align: 'center',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setOrigin(0.5);

    const container = this.add.container(0, 0, [overlay, roleText]).setDepth(1000);

    this.time.delayedCall(message ? 2500 : 1500, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          container.destroy();
        },
      });
    });
  }
}
