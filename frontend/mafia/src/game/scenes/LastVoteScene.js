import Phaser from 'phaser';
import axios from 'axios';
import setBackground from '@/game/utils/map';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedClock from '@/game/ui/clock/BaseClock';
import showFixedRoleText from '@/game/ui/role/UserRole';

export default class LastVoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LastVoteScene' });
  }

  init() {
    this.hasVoted = false;
    this.voteResult = this.registry.get('voteResult');
    console.log(this.voteResult);
  }

  create() {
    setBackground(this);
    showFixedClock(this);
    showFixedRoleText(this);
    sceneChanger(this);
    const { width, height } = this.scale.gameSize;

    this.createMainContainer(width, height);
  }

  createMainContainer(width, height) {
    this.add
      .rectangle(width / 2, height / 2, width * 0.8, height * 0.6, 0x000000, 0.9)
      .setStrokeStyle(4, 0x8b0000);

    const messageText = this.add
      .text(width / 2, height * 0.45, `생존자${this.voteResult}를 처형 시키겠습니까?`, {
        fontSize: '32px',
        fill: '#ff0000',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#8b0000',
          blur: 10,
          stroke: true,
          fill: true,
        },
        align: 'center',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: messageText,
      y: '+=2',
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.createVoteButtons(width, height);
  }

  createVoteButtons(width, height) {
    this.confirmButton = this.add
      .rectangle(width / 2 - 80, height * 0.55, 120, 45, 0x1a1a1a)
      .setStrokeStyle(2, 0xff0000)
      .setInteractive({ useHandCursor: true });

    this.confirmText = this.add
      .text(width / 2 - 80, height * 0.55, '처형', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.cancelButton = this.add
      .rectangle(width / 2 + 80, height * 0.55, 120, 45, 0x8b0000)
      .setStrokeStyle(2, 0x8b0000)
      .setInteractive({ useHandCursor: true });

    this.cancelText = this.add
      .text(width / 2 + 80, height * 0.55, '무죄', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    [this.confirmButton, this.cancelButton].forEach((button) => {
      button
        .on('pointerover', function () {
          this.scene.tweens.add({
            targets: [
              button,
              button === this.scene.confirmButton ? this.scene.confirmText : this.scene.cancelText,
            ],
            x: '+=1',
            y: '+=1',
            duration: 50,
            yoyo: true,
            repeat: 3,
          });

          this.setFillStyle(button === this.scene.confirmButton ? 0x333333 : 0xff0000);
        })
        .on('pointerout', function () {
          this.setFillStyle(button === this.scene.confirmButton ? 0x1a1a1a : 0x8b0000);
        });
    });

    this.confirmButton.on('pointerdown', () => this.handleVote('처형'));
    this.cancelButton.on('pointerdown', () => this.handleVote('무죄'));
  }

  async handleVote(voteType) {
    if (this.hasVoted) return;

    this.hasVoted = true;
    this.finalVote = voteType === '처형';

    // "처형" 버튼을 눌렀을 때만 API 요청
    if (voteType === '처형') {
      try {
        const roomId = this.registry.get('roomId');
        await axios.get(`/api/game/${roomId}/finalvote`);
      } catch (error) {
        console.error('Final vote API request failed:', error);
      }
    }

    this.cameras.main.shake(500, 0.008);
    this.cameras.main.flash(300, 255, 0, 0, 0.4);

    this.confirmButton.setAlpha(0.5);
    this.cancelButton.setAlpha(0.5);
    this.confirmText.setAlpha(0.5);
    this.cancelText.setAlpha(0.5);
  }
}
