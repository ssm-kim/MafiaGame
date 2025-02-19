import Phaser from 'phaser';
import setBackground from '@/game/utils/map';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
    this.playerInfoGroup = null;
    this.gameResult = null;
    this.players = null;
    this.background = null;
    this.victoryText = null;
    this.zombieImages = [];
  }

  preload() {
    const assetsBasePath = '/game/images';
    this.load.image('mafia', `${assetsBasePath}/maps/classroom.png`);
    this.load.image('zombie', `${assetsBasePath}/characters/zombie.png`);
    this.load.image('mutant', `${assetsBasePath}/characters/mutant.gif`);
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(2000);

    const { width, height } = this.cameras.main;
    this.background = this.add.image(width / 2, height / 2, 'mafia');
    this.background.setDisplaySize(width, height);
    this.background.setName('background');

    this.checkGameStatus();
    this.scale.on('resize', this.resize, this);
  }

  resize = () => {
    const { width, height } = this.cameras.main;

    if (this.background) {
      this.background.setPosition(width / 2, height / 2);
      this.background.setDisplaySize(width, height);
    }

    if (this.victoryText) {
      this.victoryText.setPosition(width / 2, height / 2 - 100);
    }

    if (this.players && this.gameResult) {
      this.createPlayerList();
    }
  };

  checkGameStatus() {
    this.gameData = this.registry.get('gameData');

    const dummyPlayers = [
      { nickname: '플레이어1', role: '감염자' },
      { nickname: '플레이어2', role: '의사' },
      { nickname: '플레이어3', role: '생존자' },
      { nickname: '플레이어4', role: '감염자' },
      { nickname: '플레이어5', role: '연구원' },
      { nickname: '플레이어6', role: '돌연변이' },
      { nickname: '플레이어7', role: '생존자' },
      { nickname: '플레이어8', role: '생존자' },
    ];

    if (this.gameData.isSuccess) {
      this.gameResult = this.gameData.result;
      this.players = dummyPlayers;
      this.createGameOverScreen();
    }
  }

  createGameOverScreen() {
    this.createVictoryText(this.gameData.status);
    this.createPlayerList();
  }

  createVictoryText(status) {
    const config = this.getVictoryConfig(status);
    const victoryTextX = this.cameras.main.centerX;
    const victoryTextY = this.cameras.main.centerY - 100;

    if (this.victoryText) {
      this.victoryText.destroy();
    }

    this.victoryText = this.add
      .text(victoryTextX, victoryTextY, config.message, {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '48px',
        fill: config.color,
      })
      .setOrigin(0.5);
  }

  createPlayerList() {
    this.clearZombieImages();

    if (this.playerInfoGroup) {
      this.playerInfoGroup.clear(true, true);
    }
    this.playerInfoGroup = this.add.group();

    const winners = this.players.filter((player) =>
      this.isWinningRole(player.role, this.gameResult.status),
    );
    const losers = this.players.filter(
      (player) => !this.isWinningRole(player.role, this.gameResult.status),
    );
    const { centerX, centerY } = this.cameras.main;

    const spacing = 120;
    const totalLosers = losers.length;
    const startXLosers = centerX - (spacing * (totalLosers - 1)) / 2;

    losers.forEach((player, index) => {
      const x = startXLosers + index * spacing;
      const textColor = this.getPlayerTextColor(player.role);

      const playerText = this.add
        .text(x, centerY - 250, player.nickname, {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '24px',
          fill: textColor,
        })
        .setOrigin(0.5);

      const roleText = this.add
        .text(x, playerText.y + playerText.height / 2 + 15, player.role, {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '20px',
          fill: textColor,
        })
        .setOrigin(0.5);

      this.playerInfoGroup.add(playerText);
      this.playerInfoGroup.add(roleText);
    });

    const winnerSpacing = 160;
    const totalWinners = winners.length;
    const startXWinnersIncreased = centerX - (winnerSpacing * (totalWinners - 1)) / 2;

    winners.forEach((player, index) => {
      const x = startXWinnersIncreased + index * winnerSpacing;
      const textColor = this.getPlayerTextColor(player.role);

      const playerText = this.add
        .text(x, centerY + 10, player.nickname, {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '32px',
          fill: textColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const roleText = this.add
        .text(x, playerText.y + playerText.height / 2 + 15, player.role, {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '24px',
          fill: textColor,
        })
        .setOrigin(0.5);

      this.playerInfoGroup.add(playerText);
      this.playerInfoGroup.add(roleText);

      if (this.gameResult.status === 'ZOMBIE_WIN') {
        this.addZombieImage(x, roleText.y + roleText.height + 50);
      } else if (this.gameResult.status === 'MUTANT_WIN') {
        this.addZombieImage(x, roleText.y + roleText.height + 50);
      } else if (this.gameResult.status === 'CITIZEN_WIN') {
        this.addZombieImage(x, roleText.y + roleText.height + 50);
      }
    });
  }

  addZombieImage(x, y) {
    const zombieImage = this.add.image(x, y, 'zombie');
    zombieImage.setOrigin(0.5);
    const scale = 0.4;
    zombieImage.setScale(scale);
    this.zombieImages.push(zombieImage);
    this.playerInfoGroup.add(zombieImage);
  }

  clearZombieImages() {
    this.zombieImages.forEach((zombie) => zombie.destroy());
    this.zombieImages = [];
  }

  isWinningRole(role, status) {
    const winningRoles = {
      CITIZEN_WIN: ['생존자', '연구원', '의사'],
      ZOMBIE_WIN: ['감염자'],
      MUTANT_WIN: ['돌연변이'],
    };

    return winningRoles[status]?.includes(role) || false;
  }

  getPlayerTextColor(role) {
    const roleColors = {
      감염자: '#ff0000',
      의사: '#ffffff',
      연구원: '#ffffff',
      생존자: '#FFFFFF',
      돌연변이: '#aeb404',
    };
    return roleColors[role] || '#ffffff';
  }

  getVictoryConfig(status) {
    const configs = {
      CITIZEN_WIN: { message: '생존자 승리', color: '#ffffff' },
      ZOMBIE_WIN: { message: '감염자 승리', color: '#ff0000' },
      MUTANT_WIN: { message: '돌연변이 승리', color: '#aeb404' },
      PLAYING: { message: '게임이 진행중입니다.', color: '#ffffff' },
    };
    return configs[status] || { message: '게임이 종료되었습니다.', color: '#ffffff' };
  }

  shutdown() {
    if (this.playerInfoGroup) {
      this.playerInfoGroup.clear(true, true);
    }
    if (this.background) {
      this.background.destroy();
    }
    if (this.victoryText) {
      this.victoryText.destroy();
    }
    this.clearZombieImages();
    this.scale.off('resize', this.resize);
  }
}
