import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import { resetVoteSelection, highlightVoteSelection } from '@/game/utils/voteUtils';
import createVoteContainer from '@/game/ui/vote/VoteContainer';
import { sceneTimeout } from '@/game/utils/time';

export default class VoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VoteScene' });
  }

  init() {
    const playerInfo = this.registry.get('playerInfo');

    this.character = playerInfo.character;
    this.role = playerInfo.role;

    this.target = null;
    this.voteSelections = {};

    this.sceneTime = sceneTimeout.DAY_VOTE;
    this.remainingTime = this.sceneTime / 1000;

    this.barProgress = 1;
    this.hasVoted = false;
    this.voteResults = {};
    this.socketService = this.registry.get('socketService');
  }

  create() {
    setBackground(this);
    this.createLayout();
    this.setupSocketListeners();
    this.scale.on('resize', this.resize, this);
    this.cameras.main.fadeIn(400);
  }

  setupSocketListeners() {
    if (this.socketService && this.socketService.socket) {
      this.socketService.socket.on('vote-update', (data) => {
        this.updateVoteResults(data);
      });
    }
  }

  createLayout() {
    // const { width, height } = this.scale.gameSize;
    const { width } = this.scale.gameSize;

    // 1. 타이머 컨테이너
    this.timerContainer = this.add.container(width / 2, this.getTimerY()).setDepth(1001);

    // 타이머 텍스트
    this.timerText = this.add
      .text(0, 0, '15', {
        fontSize: this.getFontSize(),
        fill: '#FFD700',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          color: '#FFFFFF',
          blur: 8,
          offsetX: 2,
          offsetY: 2,
          stroke: true,
        },
      })
      .setOrigin(0.5);

    // 게이지 바 설정
    const barWidth = this.getBarWidth();
    // const barHeight = this.getBarHeight();

    // 게이지 바 배경
    this.timerBarBg = this.add.graphics().setPosition(-barWidth / 2, 30);
    this.updateTimerBar(this.timerBarBg, 0x666666, 0.8, 1);

    // 게이지 바
    this.timerBar = this.add.graphics().setPosition(-barWidth / 2, 30);
    this.updateTimerBar(this.timerBar, 0x00ff00, 1, 1);

    this.timerContainer.add([this.timerBarBg, this.timerBar, this.timerText]);

    // 2. 투표 UI
    this.mainContainer = this.add.container(width / 2, this.getVoteContainerY()).setDepth(1000);

    const voteGrid = createVoteContainer(
      this,
      0,
      0,
      this.getVoteGridWidth(),
      this.getVoteGridHeight(),
      Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        nickname: `생존자 ${i + 1}`,
      })),
    );

    this.mainContainer.add(voteGrid);

    // 3. 타이머 시스템
    this.setupTimer();
  }

  setupTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.remainingTime -= 1;
        this.timerText.setText(`${this.remainingTime}`);

        const newProgress = this.remainingTime / this.sceneTime;

        this.tweens.add({
          targets: this,
          barProgress: newProgress,
          duration: 1000,
          ease: 'Linear.easeInOut',
          onUpdate: () => {
            this.updateTimerBar(
              this.timerBar,
              this.getBarColor(this.barProgress),
              1,
              this.barProgress,
            );
          },
        });

        if (this.remainingTime <= 10) {
          this.timerText.setColor('#FF5555');
        }

        if (this.remainingTime <= 0) {
          this.timerEvent.destroy();
          this.cameras.main.fade(800, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.get('SceneManager').loadSceneData(this, 'LastVoteScene');

            // this.scene.start('LastVoteScene', {
            //   voteResults: this.voteResults,
            // });
          });
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  handlePlayerSelection(playerNumber) {
    // 이미 같은 대상을 선택한 경우
    if (this.target === playerNumber) {
      resetVoteSelection(this, playerNumber);
      this.target = null;
      return;
    }

    // 이전 선택 초기화
    if (this.target) {
      resetVoteSelection(this, this.target);
    }

    this.target = playerNumber;
    highlightVoteSelection(this, playerNumber);
  }

  async submitVote() {
    if (!this.target) {
      this.showMessage('투표할 대상을 선택해주세요');
      return;
    }
  
    if (this.hasVoted) {
      this.showMessage('이미 투표하셨습니다');
      return;
    }
  
    const roomId = this.registry.get('roomId');
    
    try {
      // 요청 방식 변경
      const response = await axios({
        method: 'post',
        url: `http://localhost:8080/api/game/${roomId}/vote`,
        params: {
          targetNo: this.target
        },
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
  
      if (response.data.isSuccess) {
        this.hasVoted = true;
        this.showMessage('투표가 완료되었습니다');
      }
    } catch (error) {
      console.log('전체 에러 정보:', error);
      console.log('요청 설정:', error.config);
      console.log('응답 데이터:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || '투표 중 오류가 발생했습니다';
      this.showMessage(errorMessage);
    }
  }

  showMessage(text) {
    const { width, height } = this.scale.gameSize;
    const message = this.add
      .text(width / 2, height * 0.6, text, {
        fontSize: '24px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    this.time.delayedCall(2000, () => message.destroy());
  }

  // 반응형 크기 계산 메서드들
  getFontSize() {
    return Math.min(48, this.scale.width * 0.04);
  }

  getBarWidth() {
    return Math.min(200, this.scale.width * 0.3);
  }

  getBarHeight() {
    return Math.min(15, this.scale.height * 0.02);
  }

  getTimerY() {
    return this.scale.height * 0.1;
  }

  getVoteContainerY() {
    return this.scale.height * 0.55;
  }

  getVoteGridWidth() {
    return this.scale.width * 0.88;
  }

  getVoteGridHeight() {
    return this.scale.height * 0.72;
  }

  resize() {
    // const { width, height } = this.scale.gameSize;
    const { width } = this.scale.gameSize;

    this.timerContainer.setPosition(width / 2, this.getTimerY());
    this.timerText.setFontSize(this.getFontSize());

    const barWidth = this.getBarWidth();
    // const barHeight = this.getBarHeight();

    this.timerBarBg.setPosition(-barWidth / 2, 30);
    this.timerBar.setPosition(-barWidth / 2, 30);

    this.updateTimerBar(this.timerBarBg, 0x666666, 0.8, 1);
    this.updateTimerBar(this.timerBar, this.getBarColor(this.barProgress), 1, this.barProgress);

    this.mainContainer.setPosition(width / 2, this.getVoteContainerY());
  }

  updateTimerBar(graphics, color, alpha, progress) {
    const barWidth = this.getBarWidth();
    const barHeight = this.getBarHeight();

    graphics.clear();
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(0, 0, barWidth * progress, barHeight, 5);
  }

  getBarColor(progress) {
    if (progress > 0.6) return 0x00ff00;
    if (progress > 0.3) return 0xffff00;
    return 0xff0000;
  }
}
