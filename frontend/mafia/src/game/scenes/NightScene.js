import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import MafiaRole from '@/game/ui/role/MafiaRole.js';
import PoliceRole from '@/game/ui/role/PoliceRole.js';
import DoctorRole from '@/game/ui/role/DoctorRole.js';
import MutantRole from '@/game/ui/role/MutantRole.js';
import showFixedRoleText from '@/game/ui/role/UserRole';
import CitizenRole from '@/game/ui/role/CitizenRole';
import { sceneTimeout } from '@/game/utils/time';

export default class NightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NightScene' });
    this.remainingTime = sceneTimeout.NIGHT_ACTION;
  }

  init() {
    this.gameData = this.registry.get('gameData');
    this.character = this.registry.get('playerInfo').character;
    this.playerInfo = this.registry.get('playerInfo');
  }

  create() {
    setBackground(this);

    this.time.addEvent({
      delay: this.remainingTime,
      callback() {
        this.scene.get('SceneManager').loadSceneData('MainScene');
      },
      callbackScope: this,
    });

    // 밤 전환 효과 추가
    this.createNightTransition();

    // 나머지 로직은 페이드 효과 완료 후 실행
    this.time.delayedCall(3000, () => {
      this.assignRoles();
      this.userRole = showFixedRoleText(this);
      // this.showFixedClock();
    });
  }

  createNightTransition() {
    // 화면을 덮는 검은색 오버레이 생성 (처음에는 불투명)
    const overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
    );
    overlay.setOrigin(0);
    overlay.setAlpha(1); // 처음엔 완전히 검은 화면

    // "밤이 되었습니다..." 텍스트 추가 (카메라 중앙에 표시)
    const nightText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '밤이 되었습니다...',
      {
        font: '60px BMEuljiro10yearslater',
        fill: '#ff0000',
      },
    );
    nightText.setOrigin(0.5); // 텍스트의 기준점을 중앙으로 설정

    // 1초 후 텍스트가 사라지는 효과 실행
    this.time.delayedCall(1000, () => {
      // 텍스트를 흩어지게 하고 사라지게 하는 효과
      this.tweens.add({
        targets: nightText,
        alpha: 0, // 텍스트 사라짐
      });
    });

    // 텍스트가 사라진 후 (2초 뒤) 오버레이 서서히 밝아짐
    this.time.delayedCall(1, () => {
      this.tweens.add({
        targets: overlay,
        alpha: 0.4, // 검은 화면을 서서히 밝게
        duration: 2500,
        ease: 'Linear',
      });
    });
  }

  assignRoles() {
    const currentPlayer = this.playerInfo.role;

    if (currentPlayer === '생존자') {
      // 일반 시민을 위한 메시지 표시
      this.currentRole = new CitizenRole(this);
    } else if (currentPlayer === '감염자') {
      // 특수 역할 UI 생성
      this.currentRole = new MafiaRole(this);
    } else if (currentPlayer === '연구원') {
      this.currentRole = new PoliceRole(this, [currentPlayer]);
    } else if (currentPlayer === '의사') {
      this.currentRole = new DoctorRole(this, [currentPlayer]);
    } else if (currentPlayer === '돌연변이') {
      this.currentRole = new MutantRole(this, [currentPlayer]);
    }
  }

  // destory() {
  //   this.currentRole.destroy();
  // }
}
