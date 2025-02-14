import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import sceneChanger from '@/game/utils/time';
// import { sceneTimeout } from '@/game/utils/time';

export default class LastVoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatementScene' });
  }

  init(data) {
    this.targetPlayerId = data?.targetPlayerId;

    this.voteResults = data.voteResults || this.registry.get('voteResults') || {};
    // this.socketService = this.registry.get('socketService');
    // this.sceneTime = sceneTimeout.DAY_FINAL_STATEMENT;
    // this.remainingTime = this.sceneTime / 1000;
    this.hasVoted = false;
    this.finalVote = null;
    this.calculateMostVoted();
  }

  calculateMostVoted() {
    const voteCounts = {};
    Object.values(this.voteResults).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let mostVotedPlayer = null;
    Object.entries(voteCounts).forEach(([playerId, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        mostVotedPlayer = playerId;
      }
    });

    const totalPlayers = Object.keys(this.voteResults).length;
    this.isMajority = maxVotes > totalPlayers / 2;
    this.votedPlayer = mostVotedPlayer;
    this.voteCount = maxVotes;
  }

  create() {
    setBackground(this);
    sceneChanger(this);
    const { width, height } = this.scale.gameSize;

    // 중앙 컨테이너 생성
    this.createMainContainer(width, height);

    // 타이머 생성
    this.createTimer(width);

    // 소켓 이벤트 설정
    // this.setupSocketListeners();
  }

  createMainContainer(width, height) {
    // 메인 컨테이너 배경 (피 묻은 효과)
    this.add
      .rectangle(width / 2, height / 2, width * 0.8, height * 0.6, 0x000000, 0.9)
      .setStrokeStyle(4, 0x8b0000); // 더 진한 붉은색 테두리

    // 처형 확인 메시지 (떨림 효과 추가)
    const messageText = this.add
      .text(width / 2, height * 0.45, `생존자${this.targetPlayerId}의 최후 변론`, {
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

  handleTimeUp() {
    const finalResult = {
      player: this.votedPlayer,
      executed: this.isMajority && (this.finalVote ?? false),
    };

    this.registry.set('executionResult', finalResult);
    this.showFinalResult(finalResult);
  }

  showFinalResult() {
    this.time.delayedCall(3000, () => {
      this.cameras.main.fade(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // this.scene.get('SceneManager').loadSceneData('LastVoteScene');
        // this.scene.start('LastVoteScene', { targetPlayerId: this.targetPlayerId });
        // this.scene.stop('StatementScene');
        // this.scene.start('NightScene');
      });
    });
  }

  showMessage(text) {
    const { width, height } = this.scale.gameSize;
    const message = this.add
      .text(width / 2, height * 0.2, text, {
        fontSize: '24px',
        fill: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 },
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.time.delayedCall(2000, () => message.destroy());
  }

  createTimer(width) {
    // 타이머 텍스트
    this.timerText = this.add
      .text(width / 2, 40, `${this.remainingTime}`, {
        fontSize: '48px',
        fill: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
        fontFamily: 'Arial Black',
        shadow: {
          color: '#FFFFFF',
          blur: 8,
          offsetX: 2,
          offsetY: 2,
          stroke: true,
        },
      })
      .setOrigin(0.5);

    // 타이머 이벤트
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.remainingTime -= 1;

        // 0 이하로 내려가지 않도록 체크
        if (this.remainingTime < 0) {
          this.remainingTime = 0;
        }

        this.timerText.setText(`${this.remainingTime}`);

        if (this.remainingTime <= 10) {
          this.timerText.setColor('#FF5555');
        }

        if (this.remainingTime === 0) {
          this.timerEvent.destroy(); // 타이머 이벤트 정지
          this.handleTimeUp();
        }
      },
      callbackScope: this,
      loop: true,
    });
  }
}
