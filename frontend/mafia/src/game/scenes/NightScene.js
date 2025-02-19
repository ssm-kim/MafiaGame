import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import PlayerManager from '@/game/player/PlayerManager';
import SkillManager from '@/game/skills/SkillManager';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
import showFixedClock from '@/game/ui/clock/BaseClock';
import Player from '@/game/player/Player';
import getGameData from '@/game/utils/gameData';
import BGMController from '@/game/utils/BGMController';

export default class NightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NightScene' });
    this.highlightCircle = null;
  }

  init() {
    getGameData(this);
    const gameData = this.registry.get('gameData');
    const gameResult = gameData.result.gamestatus; // 게임 상태 확인

    if (gameResult !== 'PLAYING') {
      this.scene.start('GameOverScene', gameResult); // 게임 종료 씬으로 이동
    }

    this.targetPlayers = [];
    this.gameData = this.registry.get('gameData');
    this.playerInfo = this.registry.get('playerInfo');
    this.roomId = this.registry.get('roomId');

    // 현재 플레이어 상태 저장
    if (this.playerManager) {
      this.registry.set('players', this.playerManager.players);
    }

    // 이전 씬의 플레이어 매니저 정리
    if (this.playerManager) {
      this.playerManager.destroy();
    }

    // registry 데이터 정리
    if (this.registry.get('players')) {
      this.registry.remove('players');
    }
  }

  create() {
    const localPlayerInfo = this.registry.get('playerInfo');
    const playersInfo = this.registry.get('playersInfo');
    let x = 125;

    Object.values(playersInfo).forEach((player) => {
      if (player.playerNo === localPlayerInfo.playerNo) return;

      const newPlayerData = {
        isLocal: false,
        nickname: player.dead ? '사망자' : player.nickname,
        character: `character${(player.playerNo % 4) + 1}`,
        x,
        y: 0,
        // y: player.playerNo > 4 ? 444 : 222,
      };

      x += 125;

      const targetPlayer = new Player(this, newPlayerData);
      targetPlayer.playerNo = player.playerNo;

      this.targetPlayers.push(targetPlayer);
    });

    // Light2D 파이프라인 활성화 및 주변광 설정
    this.lights.enable();
    this.lights.setAmbientColor(0x000000); // 완전한 어둠

    setBackground(this);
    showFixedClock(this);
    sceneChanger(this);
    this.setupManagers();
    this.createNightTransition();

    // bgm
    this.bgmController = new BGMController(this);
    this.bgmController.playBGM('night_bgm');

    // // 렌더링 최적화
    // this.game.renderer.roundPixels = true;

    // Light2D 파이프라인 적용
    this.children.list.forEach((child) => {
      if (child.setPipeline && child.type !== 'ParticleEmitterManager') {
        child.setPipeline('Light2D');
        child.setAlpha(1);
      }
    });

    this.time.delayedCall(2000, () => {
      this.setupInteraction();
      this.setupLighting();
    });
    showFixedClock(this);
    showFixedRoleText(this);

    this.children.list.forEach((child) => {
      if (child.type === 'Text' || child.type === 'Container') {
        // child.resetPipeline();
        child.setDepth(1000); // UI 요소들을 최상단에 표시
      }
    });
  }

  setupLighting() {
    const lightRadius = this.playerInfo.role === 'ZOMBIE' ? 300 : 200;
    this.playerLight = this.lights
      .addLight(this.playerManager.localPlayer.x, this.playerManager.localPlayer.y, lightRadius)
      .setIntensity(3) // 빛의 강도를 더 낮게 설정
      // .setColor(0x333333)    // 더 어두운 회색 조명
      .setScrollFactor(1);
  }

  updateLighting() {
    if (!this.playerManager?.localPlayer || !this.playerLight) return;

    // 플레이어 위치로 라이트 이동
    this.playerLight.x = this.playerManager.localPlayer.x;
    this.playerLight.y = this.playerManager.localPlayer.y;

    // 선택적: 거리에 따른 빛 강도 조절
    const distanceFromCenter = Phaser.Math.Distance.Between(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.playerLight.x,
      this.playerLight.y,
    );

    // 거리에 따라 빛 강도 동적 조절
    const intensity = Math.max(0.8, 1.5 - distanceFromCenter / 1000);
    this.playerLight.setIntensity(intensity);
  }

  createNightTransition() {
    // 씬 전환을 위한 컨테이너 생성
    this.transitionContainer = this.add.container(0, 0);
    this.transitionContainer.setDepth(9999);

    // 오버레이 생성
    const overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
    );
    overlay.setOrigin(0);
    overlay.setAlpha(1);

    // 밤 텍스트 생성
    const nightText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      '밤이 되었습니다...',
      {
        font: '60px BMEuljiro10yearslater',
        fill: '#ff0000',
        backgroundColor: null,
      },
    );
    nightText.setOrigin(0.5);

    // 역할별 안내 메시지 생성
    const roleMessage = (() => {
      switch (this.playerInfo.role) {
        case 'ZOMBIE':
          return '감염시킬 플레이어에게 다가가 E키를 눌러 감염시키세요.';
        case 'POLICE':
          return '조사할 플레이어에게 다가가 E키를 눌러 감염 여부를 확인하세요.';
        case 'PLAGUE_DOCTOR':
          return '치료할 플레이어에게 다가가 E키를 눌러 치료하세요.';
        case 'MUTANT':
          return '돌연변이화할 플레이어에게 다가가 E키를 눌러 돌연변이로 만드세요.';
        default:
          return '생존을 위해 조심히 움직이세요.';
      }
    })();

    const roleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 50,
      roleMessage,
      {
        font: '24px BMEuljiro10yearslater',
        fill: '#ffffff',
        backgroundColor: null,
        align: 'center',
        wordWrap: { width: 600 },
      },
    );
    roleText.setOrigin(0.5);
    roleText.setAlpha(0);

    // 컨테이너에 요소들 추가
    this.transitionContainer.add([overlay, nightText, roleText]);
    this.transitionContainer.setScrollFactor(0);

    // Light2D 파이프라인에서 제외
    this.transitionContainer.list.forEach((child) => {
      if (child.setPipeline) {
        child.resetPipeline();
      }
    });
    // 텍스트 애니메이션 시퀀스
    this.time.delayedCall(1000, () => {
      // 밤 텍스트 페이드아웃
      this.tweens.add({
        targets: nightText,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          nightText.destroy();
          // 역할 텍스트 페이드인
          this.tweens.add({
            targets: roleText,
            alpha: 1,
            duration: 1000,
            onComplete: () => {
              // 3초 후 역할 텍스트 페이드아웃
              this.time.delayedCall(3000, () => {
                this.tweens.add({
                  targets: roleText,
                  alpha: 0,
                  duration: 1000,
                  onComplete: () => {
                    roleText.destroy();
                  },
                });
              });
            },
          });
        },
      });
    });

    // 오버레이 페이드아웃
    this.time.delayedCall(1, () => {
      this.tweens.add({
        targets: overlay,
        alpha: 0.4,
        duration: 4500,
        ease: 'Linear',
        onComplete: () => {
          // 트랜지션 완료 후 컨테이너 제거
          this.transitionContainer.destroy();
        },
      });
    });
  }

  setupManagers() {
    this.playerManager = new PlayerManager(this, this.playerInfo);
    this.skillManager = new SkillManager(this);
  }

  setupInteraction() {
    // E 키 바인딩
    this.interactKey = this.input.keyboard.addKey('E');
    this.interactKey.on('down', () => {
      if (this.skillManager.skillUsed) return;

      const nearestPlayer = this.findNearestPlayer();
      if (nearestPlayer) {
        console.log('상호작용 시도:', nearestPlayer); // 디버깅 로그 추가
        this.skillManager.handleInteraction(nearestPlayer);
      }
    });
  }

  findNearestPlayer() {
    if (!this.playerManager.localPlayer) return null;

    const { localPlayer } = this.playerManager;
    let nearest = null;
    let minDistance = 100;

    this.targetPlayers.forEach((player) => {
      // 더 엄격한 자기 자신 체크
      if (player.playerNo === this.playerInfo.playerId || player === localPlayer) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        localPlayer.x,
        localPlayer.y,
        player.x,
        player.y,
      );

      console.log(`Distance to player ${player.playerNo}: ${distance}`);

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
      this.updateNearestPlayerHighlight();
    }
  }

  updateNearestPlayerHighlight() {
    if (this.highlightCircle) {
      this.highlightCircle.destroy();
    }

    const nearestPlayer = this.findNearestPlayer();
    if (nearestPlayer) {
      // 외곽선 효과 (두 개의 원을 겹쳐서 사용)
      this.highlightCircle = this.add.container(nearestPlayer.x, nearestPlayer.y);

      // 바깥쪽 원
      const outerCircle = this.add.circle(0, 0, 35, 0xffff00, 0);
      outerCircle.setStrokeStyle(3, 0xffff00, 0.8);

      // 안쪽 원
      const innerCircle = this.add.circle(0, 0, 32, 0xffff00, 0);
      innerCircle.setStrokeStyle(2, 0xffffff, 0.5);

      this.highlightCircle.add([outerCircle, innerCircle]);
      this.highlightCircle.setDepth(999);

      // 회전 애니메이션
      this.tweens.add({
        targets: this.highlightCircle,
        angle: 360,
        duration: 3000,
        repeat: -1,
      });

      // 크기 변화 애니메이션
      this.tweens.add({
        targets: [outerCircle, innerCircle],
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  // 씬이 종료될 때 정리
  shutdown() {
    if (this.playerManager) {
      this.playerManager.destroy();
    }
    if (this.playerLight) {
      this.playerLight.destroy();
    }
    // 씬의 모든 게임 오브젝트 정리
    this.children.removeAll(true);

    // bgm 종료
    if (this.bgmController) {
      this.bgmController.stop();
    }
    // 추가적인 정리
    if (this.registry.get('currentBGM')) {
      this.registry.get('currentBGM').stop();
      this.registry.remove('currentBGM');
    }
  }

  destroy() {
    if (this.playerManager) {
      this.playerManager.destroy();
    }
    if (this.bgmController) {
      this.bgmController.stop();
    }
    super.destroy();
  }
}
