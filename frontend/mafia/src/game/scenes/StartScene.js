import Phaser from 'phaser';
import axios from 'axios';
import PlayerRole from '@/types/role';
import sceneChanger from '@/game/utils/sceneChange';
import getGameData from '@/game/utils/gameData';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  async init() {
    getGameData(this);
  }

  create() {
    this.time.delayedCall(50, () => {
      this.showRole();
    });
  }

  showRole() {
    this.role = this.registry.get('playerInfo').role;

    const { width, height } = this.scale.gameSize;
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.add
      .text(width / 2, height / 2, `당신은 ${this.role}입니다.`, {
        font: '28px Arial',
        fill: this.role === PlayerRole.ZOMBIE ? '#ff0000' : '#ffffff',
        align: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setOrigin(0.5);

    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(1000);
    });

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // sceneChanger(this);
      this.scene.start('SceneManager');
    });
  }
}
