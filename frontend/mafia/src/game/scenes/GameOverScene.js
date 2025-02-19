import Phaser from 'phaser';
import axios from 'axios';
import setBackground from '@/game/utils/map';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
    this.playerInfoGroup = null;
    this.gameResult = null;
  }

  // Scene이 초기화될 때 호출되는 메서드
  init(data) {
    this.gameResult = data; // 게임 결과를 'MUTANT_WIN'으로 설정 (테스트용)
  }

  // 필요한 리소스를 로드하는 메서드
  preload() {
    const assetsBasePath = '/game/images';
    this.load.image('mafia', `${assetsBasePath}/maps/classroom.png`);
    this.load.image('zombie', `${assetsBasePath}/characters/zombie.png`);
    this.load.image('mutant', `${assetsBasePath}/characters/mutant.gif`);
  }

  // Scene 생성 시 호출되는 메서드
  create() {
    this.cameras.main.setBackgroundColor('#000000'); // 배경 색상 설정
    this.cameras.main.fadeIn(2000); // 화면 페이드 인

    const { width, height } = this.cameras.main;
    this.background = this.add.image(width / 2, height / 2, 'mafia'); // 배경 이미지 설정
    this.background.setDisplaySize(width, height);
    this.background.setName('background');

    this.overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
    );
    this.overlay.setOrigin(0);
    this.overlay.setAlpha(0.6);
    this.overlay.setDepth(0);

    this.checkGameStatus(); // 게임 상태 확인
    this.scale.on('resize', this.resize, this); // 화면 크기 변경 시 처리
  }

  // 화면 크기 변경 시 호출되는 메서드
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
      this.createPlayerList(); // 플레이어 목록 생성
    }

    // overlay 크기도 조정
    if (this.overlay) {
      this.overlay.setSize(width, height);
    }

    if (this.victoryText) {
      this.victoryText.setPosition(width / 2, height / 2 - 100);
    }

    if (this.players && this.gameResult) {
      this.createPlayerList();
    }
  };

  // 서버에서 플레이어 데이터 요청
  async playersData() {
    try {
      const roomId = this.registry.get('roomId');
      const response = await axios.get(`/api/game/${roomId}/ending`);
      console.log(response.data);
      return response.data; // 서버에서 받은 데이터 반환
    } catch (error) {
      console.error('Final vote API request failed:', error);
    }
  }

  // 게임 상태 확인 후 적절한 화면을 생성
  async checkGameStatus() {
    const { playerNo } = this.registry.get('playerInfo');
    const playersData = await this.playersData();
    const players = playersData.result.endPlayers;

    if (playersData.isSuccess) {
      this.players = players;

      // playNo가 1인 플레이어가 있는 경우 DELETE 요청을 4초 뒤에 보냄
      if (playerNo === 1) {
        const roomId = this.registry.get('roomId');

        // 4초 뒤에 DELETE 요청을 보냄
        setTimeout(async () => {
          try {
            await axios.delete(`/api/game/${roomId}`);
            console.log('DELETE request sent successfully after 4 seconds');
          } catch (error) {
            console.error('DELETE API request failed:', error);
          }
        }, 5000); // 5000ms = 5초 후에 요청
      }

      this.createGameOverScreen(); // 게임 종료 화면 생성
    }
  }

  // 게임 종료 화면 생성
  createGameOverScreen() {
    // UI 요소들의 depth를 overlay보다 높게 설정
    this.createVictoryText(this.gameResult);
    if (this.victoryText) {
      this.victoryText.setDepth(3);
    }
    this.createPlayerList();
    if (this.playerInfoGroup) {
      this.playerInfoGroup.setDepth(3);
    }
  }

  // 승리 텍스트 생성
  createVictoryText(status) {
    const config = this.getVictoryConfig(status); // 승리 결과에 맞는 설정 가져오기
    const victoryTextX = this.cameras.main.centerX;
    const victoryTextY = this.cameras.main.centerY - 100;

    if (this.victoryText) {
      this.victoryText.destroy(); // 기존 텍스트가 있다면 제거
    }

    this.victoryText = this.add
      .text(victoryTextX, victoryTextY, config.message, {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '48px',
        fill: config.color,
      })
      .setOrigin(0.5); // 텍스트를 중앙에 배치
  }

  // 플레이어 목록을 생성
  createPlayerList() {
    this.clearZombieImages(); // 좀비 이미지 제거

    if (this.playerInfoGroup) {
      this.playerInfoGroup.clear(true, true); // 기존 플레이어 정보 그룹 제거
    }
    this.playerInfoGroup = this.add.group(); // 새로운 그룹 생성

    const roleMapping = {
      ZOMBIE: '감염자',
      MUTANT: '돌연변이',
      POLICE: '연구원',
      PLAGUE_DOCTOR: '의사',
      CITIZEN: '생존자',
    };

    // 승리한 플레이어와 패배한 플레이어 분리
    const winners = this.players.filter((player) =>
      this.isWinningRole(player.role, this.gameResult),
    );
    const losers = this.players.filter(
      (player) => !this.isWinningRole(player.role, this.gameResult),
    );

    const { centerX, centerY } = this.cameras.main;
    const spacing = 120;

    // 패배자 플레이어 표시
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
        .text(x, playerText.y + playerText.height / 2 + 15, roleMapping[player.role], {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '20px',
          fill: textColor,
        })
        .setOrigin(0.5);

      this.playerInfoGroup.add(playerText);
      this.playerInfoGroup.add(roleText);
    });

    // 승리자 플레이어 표시
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
        .text(x, playerText.y + playerText.height / 2 + 15, roleMapping[player.role], {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '24px',
          fill: textColor,
        })
        .setOrigin(0.5);

      this.playerInfoGroup.add(playerText);
      this.playerInfoGroup.add(roleText);

      // 승리에 따른 이미지 추가
      if (this.gameResult === 'ZOMBIE_WIN') {
        this.addZombieImage(x, roleText.y + roleText.height + 50);
      } else if (this.gameResult === 'MUTANT_WIN') {
        this.addZombieImage(x, roleText.y + roleText.height + 50);
      } else if (this.gameResult === 'CITIZEN_WIN') {
        this.addZombieImage(x, roleText.y + roleText.height + 50);
      }
    });
  }

  // 좀비 이미지 추가 (현재는 주석 처리됨)
  addZombieImage(x, y) {
    // const zombieImage = this.add.image(x, y, 'zombie');
    // zombieImage.setOrigin(0.5);
    // const scale = 0.4;
    // zombieImage.setScale(scale);
    // this.zombieImages.push(zombieImage);
    // this.playerInfoGroup.add(zombieImage);
  }

  // 좀비 이미지 제거
  clearZombieImages() {
    // this.zombieImages.forEach((zombie) => zombie.destroy());
    // this.zombieImages = [];
  }

  // 승리 조건 확인
  isWinningRole(role, status) {
    const winningRoles = {
      CITIZEN_WIN: ['CITIZEN', 'POLICE', 'PLAGUE_DOCTOR'],
      ZOMBIE_WIN: ['ZOMBIE'],
      MUTANT_WIN: ['MUTANT'],
    };

    return winningRoles[status]?.includes(role) || false;
  }

  // 플레이어 역할에 따른 텍스트 색상 반환
  getPlayerTextColor(role) {
    const roleColors = {
      ZOMBIE: '#ff0000',
      PLAGUE_DOCTOR: '#ffffff',
      POLICE: '#ffffff',
      CITIZEN: '#FFFFFF',
      MUTANT: '#aeb404',
    };
    return roleColors[role] || '#ffffff';
  }

  // 게임 결과에 따른 메시지 및 색상 반환
  getVictoryConfig(status) {
    const configs = {
      CITIZEN_WIN: { message: '생존자 승리', color: '#ffffff' },
      ZOMBIE_WIN: { message: '감염자 승리', color: '#ff0000' },
      MUTANT_WIN: { message: '돌연변이 승리', color: '#aeb404' },
      PLAYING: { message: '게임이 진행중입니다.', color: '#ffffff' },
    };
    return configs[status] || { message: '게임이 종료되었습니다.', color: '#ffffff' };
  }

  // Scene 종료 시 호출되는 메서드
  shutdown() {
    if (this.playerInfoGroup) {
      this.playerInfoGroup.clear(true, true); // 그룹 삭제
    }
    if (this.background) {
      this.background.destroy(); // 배경 이미지 삭제
    }
    if (this.victoryText) {
      this.victoryText.destroy(); // 승리 텍스트 삭제
    }
    if (this.overlay) {
      this.overlay.destroy();
    }
    this.clearZombieImages(); // 좀비 이미지 삭제
    this.scale.off('resize', this.resize); // 화면 크기 변경 이벤트 해제
  }
}
