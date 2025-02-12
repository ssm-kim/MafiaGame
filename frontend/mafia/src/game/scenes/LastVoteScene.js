import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import { sceneTimeout } from '@/game/utils/time';

export default class LastVoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LastVoteScene' });
  }

  init(data) {
    this.voteResults = data.voteResults || this.registry.get('voteResults') || {};
    // this.socketService = this.registry.get('socketService');
    this.sceneTime = sceneTimeout.DAY_FINAL_VOTE;
    this.remainingTime = this.sceneTime / 1000;
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
      .text(width / 2, height * 0.45, `생존자${this.votedPlayer}를 처형 시키겠습니까?`, {
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

    // 버튼 생성
    this.createVoteButtons(width, height);
  }

  createVoteButtons(width, height) {
    // 찬성 버튼
    this.confirmButton = this.add
      .rectangle(width / 2 - 80, height * 0.55, 120, 45, 0x1a1a1a)
      .setStrokeStyle(2, 0x8b0000)
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

    // 반대 버튼
    this.cancelButton = this.add
      .rectangle(width / 2 + 80, height * 0.55, 120, 45, 0x8b0000)
      .setStrokeStyle(2, 0xff0000)
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

    // 버튼 이벤트
    [this.confirmButton, this.cancelButton].forEach((button) => {
      button
        .on('pointerover', function () {
          // 호버 시 떨림 효과
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

    this.confirmButton.on('pointerdown', () => this.handleVote(true));
    this.cancelButton.on('pointerdown', () => this.handleVote(false));
  }

  handleVote(isConfirm) {
    if (this.hasVoted) return;

    this.hasVoted = true;
    this.finalVote = isConfirm;

    // 강한 화면 효과
    this.cameras.main.shake(500, 0.008);
    this.cameras.main.flash(300, 255, 0, 0, 0.4);

    const finalResult = {
      player: this.votedPlayer,
      executed: isConfirm,
    };
    this.registry.set('executionResult', finalResult);

    // 버튼 비활성화
    this.confirmButton.setAlpha(0.5);
    this.cancelButton.setAlpha(0.5);

    // 버튼 텍스트도 흐리게
    this.confirmText.setAlpha(0.5);
    this.cancelText.setAlpha(0.5);

    const message = isConfirm ? '처형이 결정되었습니다' : '처형이 거부되었습니다';
    this.showMessage(message);
  }

  handleTimeUp() {
    const finalResult = {
      player: this.votedPlayer,
      executed: this.isMajority && (this.finalVote ?? false),
    };

    this.registry.set('executionResult', finalResult);
    this.showFinalResult(finalResult);
  }

  showFinalResult(result) {
    const { width, height } = this.scale.gameSize;
    const resultMessage = result.executed
      ? `생존자${result.player}가 처형되었습니다.`
      : `생존자${result.player}가 살아남았습니다.`;

    this.add
      .text(width / 2, height * 0.7, resultMessage, {
        fontSize: '32px',
        fill: result.executed ? '#FF0000' : '#00FF00',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      this.cameras.main.fade(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.get('SceneManager').loadSceneData(this, 'NightScene');
        // this.scene.start('NightScene');
      });
    });
  }

  showMessage(text) {
    const { width, height } = this.scale.gameSize;
    const message = this.add
      .text(width / 2, height * 0.6, text, {
        fontSize: '24px',
        fill: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 },
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // 메시지 떨림 효과
    this.tweens.add({
      targets: message,
      y: '+=2',
      duration: 50,
      yoyo: true,
      repeat: 5,
    });

    this.time.delayedCall(2000, () => message.destroy());
  }

  setupSocketListeners() {
    if (this.socketService && this.socketService.socket) {
      this.socketService.socket.on('final-vote-update', (data) => {
        // 다른 플레이어들의 투표 현황 업데이트
        this.updateVoteDisplay(data);
      });
    }
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
