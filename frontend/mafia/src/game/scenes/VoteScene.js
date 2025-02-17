import Phaser from 'phaser';
import axios from 'axios';
import showFixedClock from '@/game/ui/clock/BaseClock';
import setBackground from '@/game/utils/map';
import { resetVoteSelection, highlightVoteSelection } from '@/game/utils/voteUtils';
import createVoteContainer from '@/game/ui/vote/VoteContainer';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
// import { sceneTimeout } from '@/game/utils/time';

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

    this.barProgress = 1;
    this.hasVoted = false;
    this.voteResults = {};
    this.socketService = this.registry.get('socketService');
  }

  create() {
    setBackground(this);
    showFixedRoleText(this);
    showFixedClock(this);
    this.createLayout();
    this.scale.on('resize', this.resize, this);
    this.cameras.main.fadeIn(400);
    this.voteResult();
    sceneChanger(this);
  }

  createLayout() {
    // const { width, height } = this.scale.gameSize;
    const { width } = this.scale.gameSize;

    // 2. 투표 UI
    this.mainContainer = this.add.container(width / 2, this.getVoteContainerY());

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

  voteResult() {
    const eventEmitter = this.registry.get('eventEmitter');

    eventEmitter.on('VOTE_RESULT', (data) => {
      try {
        console.log(data);
        this.registry.set('voteResult', data); // 데이터 저장
      } catch (error) {
        console.error('Error handling VOTE_RESULT:', error);
      }
    });
  }

  async submitVote() {
    if (!this.target) {
      this.showMessage('투표할 대상을 선택해주세요');
      return;
    }

    if (this.hasVoted) {
      this.showMessage('이미 투표하셨습니다');
      return; // 이미 투표했으면 투표를 다시 제출할 수 없습니다
    }

    // 이전 투표 결과 제거 (재투표의 경우)
    if (this.hasVoted) {
      delete this.voteResults[this.character];
    }

    // 새로운 투표 등록
    this.hasVoted = true;
    this.voteResults[this.character] = this.target;

    // 레지스트리 업데이트
    this.registry.set('voteResults', this.voteResults);

    // targetId 값을 콘솔에 로그로 확인
    console.log('투표할 대상:', this.target);

    // 서버에 투표 정보 전송
    try {
      const response = await axios.post(
        `http://localhost:8080/api/game/2/test/vote?playerNo=1&targetNo=${this.target}`,
      );
      // 서버 응답 처리
      console.log('투표 전송 성공:', response.data);
    } catch (error) {
      console.log('투표 전송 실패:', error.response.data.message);
      this.showMessage(error.response.data.message);
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
      .setOrigin(0.5)
      .setDepth(100);

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
