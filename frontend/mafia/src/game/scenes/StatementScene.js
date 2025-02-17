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

    // 중앙 컨테이너 생성
    this.createMainContainer(width, height);
  }

  createMainContainer(width, height) {
    // 메인 컨테이너 배경 (피 묻은 효과)
    this.add
      .rectangle(width / 2, height / 2, width * 0.8, height * 0.6, 0x000000, 0.9)
      .setStrokeStyle(4, 0x8b0000); // 더 진한 붉은색 테두리
    const gameData = this.registry.get('gameData');
    const { nickname } = gameData.result.playersInfo[this.voteResult];
    // 처형 확인 메시지 (떨림 효과 추가)
    const messageText = this.add
      .text(width / 2, height * 0.45, `${nickname}의 최후 변론`, {
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
