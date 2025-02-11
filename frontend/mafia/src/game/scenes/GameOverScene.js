import Phaser from 'phaser';
import setBackground from '@/game/utils/map';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    setBackground(this);
    this.checkGameStatus();
    this.scale.on('resize', this.resize, this);
  }

  checkGameStatus() {
    // 더미 데이터로 상태 설정
    const dummyData = {
      isSuccess: true,
      result: {
        status: 'MAFIA_WIN', // 예시: MAFIA_WIN, CITIZEN_WIN, MUTANT_WIN, PLAYING
      },
    };

    if (dummyData.isSuccess) {
      this.createVictoryText(dummyData.result.status);
    } else {
      this.createVictoryText('PLAYING');
    }
  }

  createVictoryText(status) {
    const config = this.getVictoryConfig(status);

    this.victoryText = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, config.message, {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '48px',
        fill: config.color,
      })
      .setOrigin(0.5);
  }

  getVictoryConfig(status) {
    const configs = {
      CITIZEN_WIN: {
        message: '생존자 팀이 승리하였습니다.',
        color: '#ffffff',
      },
      MAFIA_WIN: {
        message: '마피아 팀이 승리하였습니다.',
        color: '#ff0000',
      },
      MUTANT_WIN: {
        message: '돌연변이가 승리하였습니다.',
        color: '#AEB404',
      },
      PLAYING: {
        message: '게임이 진행중입니다.',
        color: '#ffffff',
      },
    };

    return (
      configs[status] || {
        message: '게임이 종료되었습니다.',
        color: '#ffffff',
      }
    );
  }

  resize() {
    if (this.victoryText) {
      this.victoryText.setPosition(this.cameras.main.centerX, this.cameras.main.centerY);
    }
  }

  shutdown() {
    this.scale.off('resize', this.resize);
  }
}
