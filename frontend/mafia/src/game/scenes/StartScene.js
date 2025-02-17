import Phaser from 'phaser';
import PlayerRole from '@/types/role';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  init() {
    this.gameData = this.registry.get('gameData');
    this.gameStatus = this.registry.get('gameStatus');

    console.log(this.gameData);
    console.log(this.gameStatus);
    console.log(this.registry.get('playerInfo'));
    const { role, character } = this.registry.get('playerInfo');
    this.role = role;
    this.character = character;
  }

  create() {
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
      this.scene.get('SceneManager').loadSceneData('MainScene');

      this.scene.start('MainScene');
    });
  }
}
