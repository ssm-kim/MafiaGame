import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedClock from '@/game/ui/clock/BaseClock';
import showFixedRoleText from '@/game/ui/role/UserRole';

export default class LastVoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatementScene' });
  }

  init() {
    this.voteResult = this.registry.get('voteResult');
    console.log(this.voteResult);
  }

  create() {
    setBackground(this);
    showFixedClock(this);
    showFixedRoleText(this);
    sceneChanger(this);
    const { width, height } = this.scale.gameSize;

    // 반응형 크기 조절
    this.createMainContainer(width, height);

    // 화면 크기 변경 감지 (반응형 적용)
    this.scale.on('resize', (gameSize) => {
      this.recreateScene(gameSize.width, gameSize.height);
    });
  }

  recreateScene(width, height) {
    this.children.removeAll(); // 기존 요소 삭제
    this.createMainContainer(width, height);
  }

  createMainContainer(width, height) {
    const containerWidth = Math.min(width * 0.8, 600); // 최대 600px로 제한
    const containerHeight = Math.min(height * 0.3, 250); // 최대 250px로 제한
    const centerX = width / 2;
    const centerY = height / 2;

    // 메인 컨테이너 배경 (피 묻은 효과)
    this.rexUI.add
      .roundRectangle(centerX, centerY, containerWidth, containerHeight, 15, 0x000000, 0.8)
      .setStrokeStyle(4, 0x8b0000);

    const gameData = this.registry.get('gameData');
    const { nickname } = gameData.result.playersInfo[this.voteResult];

    // 화면 크기에 따라 텍스트 크기 조절
    const fontSize = Math.max(Math.min(width * 0.05, 36), 18); // 최소 18px, 최대 36px

    // 처형 확인 메시지 (줄바꿈 지원)
    const messageText = this.add
      .text(centerX, centerY, `${nickname}의 최후 변론`, {
        fontSize: `${fontSize}px`,
        fill: '#ff0000',
        fontFamily: 'BMEuljiro10yearslater',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#8b0000',
          blur: 10,
          stroke: true,
          fill: true,
        },
        align: 'center',
        wordWrap: { width: containerWidth * 0.9, useAdvancedWrap: true },
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
  }
}
