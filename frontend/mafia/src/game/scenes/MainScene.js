import setBackground from '@/game/utils/map';
import BaseScene from '@/game/scenes/BaseScene';
import PlayerManager from '@/game/player/PlayerManager';

export default class MainScene extends BaseScene {
  constructor() {
    super('MainScene');
    // 로컬 플레이어 객체
    this.localPlayer = null;
  }

  init() {
    const { role, character } = this.registry.get('playerInfo');
    this.role = role;
    this.character = character;

    const roomId = this.registry.get('roomId');
    this.socketService = this.registry.get('socketService');

    this.playerManager = new PlayerManager(this);

    this.socketService.socket.emit('joinroom', { room: roomId, character });
    this.socketService.setupSocketEvents();
  }

  create() {
    // 배경 설정
    setBackground(this);

    // 역할에 따라 문구 색상 설정
    const textColor = this.role === '마피아' ? '#ff0000' : '#ffffff';

    // 중앙에 역할 문구 표시 (3초 동안 유지)
    this.roleText = this.add
      .text(0, 0, `당신은 ${this.role}입니다.`, {
        font: '28px Arial',
        fill: textColor,
        align: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setOrigin(0.5, 0.5);

    // 문구를 화면 중앙에 배치
    this.roleText.setScrollFactor(0); // 카메라와 독립적으로 고정
    this.roleText.setPosition(this.cameras.main.width / 2, 200);

    // 카메라 설정: 로컬 플레이어를 따라가도록 설정
    // this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(1);

    // 키 입력 생성
    this.cursors = this.input.keyboard.createCursorKeys();

    // 5초 후 역할 문구 제거
    this.time.delayedCall(3000, () => {
      this.roleText.destroy(); // 중앙 문구 삭제
      this.showFixedRoleText(); // 좌측 상단에 역할 문구 고정
    });

    // 타이머 표시용 텍스트 추가
    const duration = 30;

    this.add
      .text(this.cameras.main.width - 150, 10, `남은 시간: ${duration}`, {
        font: '18px Arial',
        fill: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
      })
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('NightScene');
      }); // 카메라 고정
  }

  showFixedRoleText() {
    // 역할에 따라 문구 색상 설정
    const textColor = this.role === '마피아' ? '#ff0000' : '#ffffff';

    // 좌측 상단에 역할 문구 표시
    this.fixedRoleText = this.add.text(10, 10, `${this.role}`, {
      font: '18px Arial',
      fill: textColor,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: { left: 5, right: 5, top: 5, bottom: 2 },
    });

    // 문구를 화면 좌측 상단에 고정
    this.fixedRoleText.setScrollFactor(0);
  }

  update() {
    this.playerManager.update();
  }

  destroy() {
    this.socketService.events.removeAllListeners();
  }
}
