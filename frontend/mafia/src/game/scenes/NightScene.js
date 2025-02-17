import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import PlayerManager from '@/game/player/PlayerManager';
import SkillManager from '@/game/skills/SkillManager';
import sceneChanger from '@/game/utils/sceneChange';

export default class NightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NightScene' });
  }

  init() {
    this.gameData = this.registry.get('gameData');
    this.playerInfo = this.registry.get('playerInfo');
    this.socketService = this.registry.get('socketService');
    this.roomId = this.registry.get('roomId');

    if (this.playerManager) {
      this.registry.set('players', this.playerManager.players);
    }
  }

  create() {
    // Light2D 파이프라인 활성화
    this.lights.enable();
    this.lights.setAmbientColor(0x000000);
    
    setBackground(this);
    this.createNightTransition();
    
    // 모든 게임 오브젝트에 Light2D 적용
    this.children.list.forEach(child => {
      if (child.setPipeline) {
        child.setPipeline('Light2D');
      }
    });
    this.time.delayedCall(3000, () => {
      this.setupManagers();
      this.setupInteraction();
      this.setupLighting();
    });

    sceneChanger(this);
  }

  setupLighting() {
    // 플레이어 주변 조명 생성
    const lightRadius = this.playerInfo.role === 'ZOMBIE' ? 300 : 200;
    this.playerLight = this.lights.addLight(
      this.playerManager.localPlayer.x,
      this.playerManager.localPlayer.y,
      lightRadius
    ).setIntensity(3);
  }

  updateLighting() {
    if (!this.playerManager?.localPlayer || !this.playerLight) return;
    
    // 플레이어 위치로 라이트 이동
    this.playerLight.x = this.playerManager.localPlayer.x;
    this.playerLight.y = this.playerManager.localPlayer.y;
  }

  createNightTransition() {
    // 씬 전환을 위한 컨테이너 생성
    this.transitionContainer = this.add.container(0, 0);
    this.transitionContainer.setDepth(9999); // 최상위 depth 설정

    // 오버레이 생성
    const overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000
    );
    overlay.setOrigin(0);
    overlay.setAlpha(1);

    // 텍스트 생성
    const nightText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '밤이 되었습니다...',
      {
        font: '60px BMEuljiro10yearslater',
        fill: '#ff0000',
        backgroundColor: null // 배경 제거
      }
    );
    nightText.setOrigin(0.5);

    // 컨테이너에 요소들 추가
    this.transitionContainer.add([overlay, nightText]);
    this.transitionContainer.setScrollFactor(0); // 화면에 고정

    // Light2D 파이프라인에서 제외
    this.transitionContainer.list.forEach(child => {
      if (child.setPipeline) {
        child.resetPipeline();
      }
    });

    // 텍스트 페이드아웃
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: nightText,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          nightText.destroy();
        }
      });
    });

    // 오버레이 페이드아웃
    this.time.delayedCall(1, () => {
      this.tweens.add({
        targets: overlay,
        alpha: 0.4,
        duration: 2500,
        ease: 'Linear',
        onComplete: () => {
          // 트랜지션 완료 후 컨테이너 제거
          this.transitionContainer.destroy();
        }
      });
    });
  }

  setupManagers() {
    this.playerManager = new PlayerManager(this, this.playerInfo);
  
    // // 모든 플레이어의 애니메이션 재설정
    // this.playerManager.players.forEach(player => {
    //   player.anims = this.anims;
    // });
  
    this.skillManager = new SkillManager(this);
  }

  setupInteraction() {
    // E 키 바인딩
    this.interactKey = this.input.keyboard.addKey('E');
    this.interactKey.on('down', () => {
      if (this.skillManager.skillUsed) return;

      const nearestPlayer = this.findNearestPlayer();
      if (nearestPlayer) {
        this.skillManager.handleInteraction(nearestPlayer);
      }
    });
  }

  findNearestPlayer() {
    if (!this.playerManager.localPlayer) return null;

    const localPlayer = this.playerManager.localPlayer;
    let nearest = null;
    let minDistance = 100; // 상호작용 범위

    this.playerManager.players.forEach((player, playerId) => {
      if (playerId === this.playerInfo.playerId) return;

      const distance = Phaser.Math.Distance.Between(
        localPlayer.x,
        localPlayer.y,
        player.x,
        player.y
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = player;
      }
    });

    return nearest;
  }

  update() {
    if (this.playerManager?.localPlayer) {
      this.playerManager.update();
      this.updateLighting();
    }
  }
}
