import api from '@/api/axios';

export default class SkillManager {
  constructor(scene) {
    this.scene = scene;
    this.skillUsed = false;
    this.socketService = this.scene.socketService;
    this.roomId = this.scene.roomId;
  }

  handleInteraction(targetPlayer) {
    if (this.skillUsed) return;

    const { role } = this.scene.playerInfo;

    switch (role) {
      case '감염자': // 백엔드에서 오는 그대로의 역할명 사용
        this.infectPlayer(targetPlayer);
        break;
      case '연구원':
        this.investigatePlayer(targetPlayer);
        break;
      case '의사':
        this.healPlayer(targetPlayer);
        break;
      case '돌연변이':
        this.mutatePlayer(targetPlayer);
        break;
      default:
        console.error('알 수 없는 역할:', role);
    }
  }

  async infectPlayer(target) {
    this.skillUsed = true;
    this.createSkillEffect('ZOMBIE', target);
    this.scene.cameras.main.shake(200, 0.01);
    this.scene.cameras.main.flash(300, 255, 0, 0);

    try {
      const response = await api.post(
        `/api/game/${this.roomId}/target/set?targetNo=${target.playerNo}`,
      );

      if (!response.data.isSuccess) {
        console.error('API 요청 실패:', response.data);
      }
    } catch (e) {
      console.error('API 요청 중 오류:', e);
    }
  }

  async mutatePlayer(target) {
    this.skillUsed = true;
    this.createSkillEffect('MUTANT', target);
    this.scene.cameras.main.shake(200, 0.01);
    this.scene.cameras.main.flash(300, 255, 0, 255);

    try {
      const response = await api.post(
        `/api/game/${this.roomId}/target/set?targetNo=${target.playerNo}`,
      );

      if (response.data.isSuccess) {
        console.error('API 요청 실패:', response.data);
      }
    } catch (e) {
      console.error('API 요청 중 오류:', e);
    }
  }

  async investigatePlayer(target) {
    this.skillUsed = true;
    this.createSkillEffect('POLICE', target);
    this.scene.cameras.main.shake(200, 0.01);
    this.scene.cameras.main.flash(300, 0, 0, 255);

    try {
      const response = await api.post(
        `/api/game/${this.roomId}/target/set?targetNo=${target.playerNo}`,
      );

      if (response.data.isSuccess) {
        const result = response.data.result.includes('ZOMBIE');
        const resultText = result
          ? `해당 타겟은 감염자가 맞습니다`
          : `해당 타겟은 감염자가 아닙니다`;

        this.scene.add
          .text(target.x, target.y - 80, resultText, {
            font: '20px BMEuljiro10yearslater',
            fill: '#ff0000',
            padding: 14,
            backgroundColor: 'black',
          })
          .setDepth(1000)
          .setOrigin(0.5, 0.5);
      } else {
        console.error('API 요청 실패:', response.data);
      }
    } catch (e) {
      console.error('API 요청 중 오류:', e);
    }
  }

  async healPlayer(target) {
    this.skillUsed = true;
    this.createSkillEffect('PLAGUE_DOCTOR', target);
    this.scene.cameras.main.shake(200, 0.01);
    this.scene.cameras.main.flash(300, 0, 255, 0);

    try {
      const response = await api.post(
        `/api/game/${this.roomId}/target/set?targetNo=${target.playerNo}`,
      );

      if (!response.data.isSuccess) {
        console.error('API 요청 실패:', response.data);
      }
    } catch (e) {
      console.error('API 요청 중 오류:', e);
    }
  }

  createSkillEffect(role, target) {
    switch (role) {
      case 'ZOMBIE':
        this.createZombieEffect(target);
        break;
      case 'POLICE':
        this.createResearcherEffect(target);
        break;
      case 'PLAGUE_DOCTOR':
        this.createDoctorEffect(target);
        break;
      case 'MUTANT':
        this.createMutantEffect(target);
        break;
      default:
        break;
    }
  }

  createZombieEffect(target) {
    // 메인 감염 원
    const mainCircle = this.scene.add.circle(target.x, target.y, 25, 0xff0000);
    mainCircle.setAlpha(0.6);
    mainCircle.setDepth(1001);

    this.scene.tweens.add({
      targets: mainCircle,
      scale: 2,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        mainCircle.destroy();
      },
    });

    // 불규칙한 감염 파편 효과
    for (let i = 0; i < 12; i += 1) {
      const shard = this.scene.add.triangle(target.x, target.y, 0, -10, 8, 5, -8, 5, 0xff0000);
      shard.setAlpha(0.8);
      shard.setDepth(1001);

      const angle = (i * Math.PI * 2) / 12 + Math.random() * 0.5;
      const distance = 30 + Math.random() * 20;

      this.scene.tweens.add({
        targets: shard,
        x: target.x + Math.cos(angle) * distance,
        y: target.y + Math.sin(angle) * distance,
        angle: Math.random() * 360,
        scale: 0,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          shard.destroy();
        },
      });
    }
  }

  createResearcherEffect(target) {
    // 조사 스캔 원
    const scanCircle = this.scene.add.circle(target.x, target.y, 40, 0x00ffff);
    scanCircle.setAlpha(0.3);
    scanCircle.setDepth(1001);

    // 조사 스캔 서클 애니메이션션
    this.scene.tweens.add({
      targets: scanCircle,
      scale: 2,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        scanCircle.destroy();
      },
    });

    // 스캔 라인 효과
    for (let i = 0; i < 6; i += 1) {
      const line = this.scene.add.rectangle(target.x, target.y, 4, 50, 0x00ffff);
      line.setAlpha(0.8);
      line.setDepth(1001);

      const angle = (i * Math.PI * 2) / 6;
      line.setRotation(angle);

      this.scene.tweens.add({
        targets: line,
        scaleY: 2,
        alpha: 0,
        duration: 1200,
        onComplete: () => {
          line.destroy();
        },
      });
    }
  }

  createDoctorEffect(target) {
    // 메인 힐링 서클
    const mainCircle = this.scene.add.circle(target.x, target.y, 20, 0x00ff88);
    mainCircle.setAlpha(0.6);
    mainCircle.setDepth(1001);

    // 메인 서클 애니메이션
    this.scene.tweens.add({
      targets: mainCircle,
      scale: 2,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        mainCircle.destroy();
      },
    });

    // 여러 개의 작은 원들이 퍼져나가는 효과
    for (let i = 0; i < 20; i += 1) {
      const smallCircle = this.scene.add.circle(target.x, target.y, 5, 0x00ff88);
      smallCircle.setAlpha(0.8);
      smallCircle.setDepth(1001);

      const angle = (i * Math.PI * 2) / 8;
      const distance = 40;

      this.scene.tweens.add({
        targets: smallCircle,
        x: target.x + Math.cos(angle) * distance,
        y: target.y + Math.sin(angle) * distance,
        scale: 0.5,
        alpha: 0,
        duration: 1600,
        onComplete: () => {
          smallCircle.destroy();
        },
      });
    }
  }

  createMutantEffect(target) {
    // 중앙 돌연변이 폭발 효과
    const mainCircle = this.scene.add.circle(target.x, target.y, 30, 0x9932cc);
    mainCircle.setAlpha(0.7);
    mainCircle.setDepth(1001);

    // 돌연변이 폭발 효과 애니메이션
    this.scene.tweens.add({
      targets: mainCircle,
      scale: 3,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        mainCircle.destroy();
      },
    });

    // 불규칙한 돌연변이 입자들
    for (let i = 0; i < 15; i += 1) {
      const particle = this.scene.add.circle(target.x, target.y, 8, 0x9932cc);
      particle.setAlpha(0.8);
      particle.setDepth(1001);

      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 30;

      this.scene.tweens.add({
        targets: particle,
        x: target.x + Math.cos(angle) * distance,
        y: target.y + Math.sin(angle) * distance,
        scale: { from: 1, to: 0 },
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }
}
