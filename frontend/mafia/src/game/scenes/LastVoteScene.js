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
    this.playerInfo = this.registry.get('playerInfo');
    this.hasVoted = false;
    this.voteResult = this.registry.get('voteResult');
  }

  create() {
    sceneChanger(this);

    this.registry.events.on('changedata-voteKill', (parent, value) => {
      this.showLastVoteResult(value.result);
    });

    setBackground(this);
    showFixedClock(this);
    showFixedRoleText(this);
    sceneChanger(this);
    const { width, height } = this.scale.gameSize;

    this.createMainContainer(width, height);

    if (this.playerInfo.dead || this.playerInfo.role === '돌연변이') {
      this.disableButtons();
    }

    this.scale.on('resize', (gameSize) => {
      this.recreateScene(gameSize.width, gameSize.height);
    });
  }

  disableButtons() {
    this.confirmButton.removeInteractive().setFillStyle(0x666666);
    this.confirmButton.setStrokeStyle(0, 0x666666);
    this.cancelButton.removeInteractive().setFillStyle(0x666666);
    this.confirmText.setColor('#999999');
    this.cancelText.setColor('#999999');
  }

  recreateScene(width, height) {
    this.children.removeAll();
    this.createMainContainer(width, height);
  }

  createMainContainer(width, height) {
    const containerWidth = Math.min(width * 0.8, 600);
    const containerHeight = Math.min(height * 0.4, 300);
    const centerX = width / 2;
    const centerY = height / 2;

    // 둥근 모서리의 메인 컨테이너 배경
    const container = this.rexUI.add
      .roundRectangle(centerX, centerY, containerWidth, containerHeight, 15, 0x000000, 0.9)
      .setStrokeStyle(4, 0xff0000);

    const gameData = this.registry.get('gameData');
    const { nickname } = gameData.result.playersInfo[this.voteResult];

    // 메시지 텍스트 - 컨테이너의 상단 중앙에 위치
    const messageText = this.add
      .text(centerX, centerY - 40, `${nickname}를 처형 시키겠습니까?`, {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'BMEuljiro10yearslater',
        align: 'center',
      })
      .setOrigin(0.5);

    // 텍스트 떨림 효과
    this.tweens.add({
      targets: messageText,
      y: '+=2',
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 버튼 컨테이너 - 메시지 아래에 위치
    const buttonSpacing = 20; // 버튼 사이의 간격
    const buttonWidth = 120;
    const buttonHeight = 45;

    // 찬성 버튼
    this.confirmButton = this.rexUI.add
      .roundRectangle(
        centerX - buttonWidth / 2 - buttonSpacing,
        centerY + 40,
        buttonWidth,
        buttonHeight,
        5,
        0xff0000,
      )
      .setStrokeStyle(2, 0xff0000)
      .setInteractive({ useHandCursor: true });

    this.confirmText = this.add
      .text(centerX - buttonWidth / 2 - buttonSpacing, centerY + 40, '처형', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'BMEuljiro10yearslater',
      })
      .setOrigin(0.5);

    // 반대 버튼
    this.cancelButton = this.rexUI.add
      .roundRectangle(
        centerX + buttonWidth / 2 + buttonSpacing,
        centerY + 40,
        buttonWidth,
        buttonHeight,
        5,
        0x1a2b3c,
      )
      .setInteractive({ useHandCursor: true });

    this.cancelText = this.add
      .text(centerX + buttonWidth / 2 + buttonSpacing, centerY + 40, '반대', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'BMEuljiro10yearslater',
      })
      .setOrigin(0.5);

    // 버튼 이벤트
    [this.confirmButton, this.cancelButton].forEach((button) => {
      button
        .on('pointerover', function () {
          this.setAlpha(0.8);
        })
        .on('pointerout', function () {
          this.setAlpha(1);
        });
    });

    this.confirmButton.on('pointerdown', () => this.handleVote('처형'));
    this.cancelButton.on('pointerdown', () => this.handleVote('반대'));
  }

  async handleVote(voteType) {
    if (this.hasVoted) return;

    this.hasVoted = true;
    this.finalVote = voteType === '처형';

    if (voteType === '처형') {
      try {
        const roomId = this.registry.get('roomId');
        await axios.get(`/api/game/${roomId}/finalvote`);
      } catch (error) {
        console.error('Final vote API request failed:', error);
      }
    }

    // 투표 후 효과
    this.cameras.main.shake(500, 0.008);
    this.cameras.main.flash(300, 255, 0, 0, 0.4);

    this.confirmButton.setAlpha(0.5);
    this.cancelButton.setAlpha(0.5);
    this.confirmText.setAlpha(0.5);
    this.cancelText.setAlpha(0.5);
  }

  showLastVoteResult(killed) {
    const blackScreen = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
    );
    blackScreen.setOrigin(0);
    blackScreen.setDepth(99999999);
    blackScreen.setScrollFactor(0);

    const lastVoteResult = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      killed ? '처형 되었습니다.' : '처형이 무산되었습니다.',
      {
        font: '32px BMEuljiro10yearslater',
        fill: killed ? '#ff0000' : '#ffffff',
        align: 'center',
      },
    );
    lastVoteResult.setOrigin(0.5);
    lastVoteResult.setDepth(999999999);
    lastVoteResult.setScrollFactor(0);

    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(2000);
    });
  }

  shutdown() {
    this.registry.events.removeAllListeners();
  }
}
