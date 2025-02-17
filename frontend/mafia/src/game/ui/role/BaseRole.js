import axios from 'axios';
import { getGameData } from '@/game/utils/gameData';

export default class BaseRole {
  constructor(scene) {
    this.scene = scene;
    this.selectedPlayer = null;
    this.gameObjects = {};
    // 리사이즈 이벤트 리스너 등록
    this.scene.scale.on('resize', this.handleResize, this);
  }

  // 공통 UI 생성
  createUI() {
    this.gameObjects = {};

    // 모달 창 배경과 테두리
    this.gameObjects.background = this.scene.rexUI.add.roundRectangle(
      0,
      0,
      500,
      400,
      20,
      0x000000,
      1,
    );

    this.gameObjects.border = this.scene.rexUI.add.roundRectangle(0, 0, 500, 400, 20, 0xffffff, 0);
    getGameData(this);
    // 제목 텍스트
    this.createTitle();

    // 플레이어 버튼 생성
    this.createPlayerButtons();

    // 액션 버튼
    this.createActionButton();

    // 초기 위치 설정
    this.updatePositions();
  }

  createTitle() {
    this.gameObjects.title = this.scene.add
      .text(0, 0, this.getTitleText(), {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '32px',
        fill: this.getTitleColor(),
      })
      .setOrigin(0.5);

    this.gameObjects.border.setStrokeStyle(2, this.getBorderColor());
  }

  // 플레이어 버튼 생성 (조건만 자식 클래스에서 오버라이드)
  createPlayerButtons() {
    this.gameObjects.playerButtons = [];
    const maxButtons = 9; // 고정된 9개의 버튼
    const gameData = this.scene.registry.get('gameData');
    // 최대 9명까지 플레이어가 존재하도록 제한
    for (let i = 0; i < maxButtons; i++) {
      const player = gameData.result.playersInfo[i + 1] || null; // 플레이어가 없으면 null로 처리
      const button = this.scene.rexUI.add.roundRectangle(
        0,
        0,
        160,
        50,
        7,
        player ? this.getButtonColor(player) : 0x2c2c32, // 플레이어가 있으면 색상 적용, 없으면 회색
      );

      const text = this.scene.add
        .text(0, 0, player ? player.nickname : '', {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '20px',
          fill: player ? this.getTextColor(player) : '#999999', // 플레이어가 있으면 텍스트 색상, 없으면 회색
        })
        .setOrigin(0.5);

      if (player && this.isPlayerSelectable(player)) {
        this.addButtonInteractivity(button, text, player);
      } else {
        // button.setInteractive(false); // 빈 버튼은 클릭 불가능하게 설정
      }

      this.gameObjects.playerButtons.push({
        button,
        text,
        index: i,
        role: player ? player.role : null,
      });
    }
  }

  // 버튼 상호작용 추가
  addButtonInteractivity(button, text, player) {
    button
      .setInteractive()
      .on('pointerover', () => {
        if (this.selectedPlayer !== player.playerNo) {
          button.setFillStyle(this.getHoverColor());
        }
      })
      .on('pointerout', () => {
        if (this.selectedPlayer !== player.playerNo) {
          button.setFillStyle(this.getButtonColor(player));
        }
      })
      .on('pointerdown', () => {
        this.handlePlayerSelection(player.playerNo, button, text, player.role);
      });
  }

  createActionButton() {
    this.gameObjects.actionButton = this.scene.rexUI.add.roundRectangle(
      0,
      0,
      300,
      50,
      7,
      this.getActionButtonColor(),
    );

    this.gameObjects.actionText = this.scene.add
      .text(0, 0, this.getActionButtonText(), {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '20px',
        fill: this.getActionButtonTextColor(),
      })
      .setOrigin(0.5);

    this.gameObjects.actionButton
      .setInteractive()
      .on('pointerover', () =>
        this.gameObjects.actionButton.setFillStyle(this.getActionButtonHoverColor()),
      )
      .on('pointerout', () =>
        this.gameObjects.actionButton.setFillStyle(this.getActionButtonColor()),
      )
      .on('pointerdown', () => this.handleVote());
  }

  handleVote = async () => {
    if (this.selectedPlayer) {
      const selectedPlayer = this.players.find((player) => player.playerNo === this.selectedPlayer);

      // 버튼 비활성화
      this.gameObjects.playerButtons.forEach(({ button, text }) => {
        button.removeInteractive();
        button.setFillStyle(0x666666);
        text.setColor('#999999');
      });

      // 결과 처리는 하위 클래스에서 구현
      this.selectedResult(selectedPlayer);

      // 서버에 투표 정보 전송
      try {
        const response = await axios.post(
          `http://localhost:8080/api/game/2/test/vote?playerNo=1&targetNo=${this.selectedPlayer}`,
        );
        // 서버 응답 처리
        console.log('투표 전송 성공:', response.data);
      } catch (error) {
        console.log('투표 전송 실패:', error.response?.data?.message || error.message);
        this.showMessage(error.response?.data?.message || '투표 전송 실패');
      }
    }
  };

  // 화면 크기에 따른 위치 업데이트
  updatePositions() {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const modalWidth = Math.min(550, screenWidth * 0.9);
    const modalHeight = Math.min(400, screenHeight * 0.9);

    this.gameObjects.background.setPosition(centerX, centerY).setSize(modalWidth, modalHeight);
    this.gameObjects.border.setPosition(centerX, centerY).setSize(modalWidth, modalHeight);
    this.gameObjects.title.setPosition(centerX, centerY - modalHeight * 0.35);

    // 플레이어 버튼 위치 업데이트
    const rows = 3; // 3개의 행 고정
    const cols = 3; // 3개의 열 고정
    const buttonWidth = Math.min(150, (modalWidth - 60) / cols);
    const buttonSpacing = buttonWidth + 20;

    this.gameObjects.playerButtons.forEach(({ button, text, index }) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = centerX + (col - (cols - 1) / 2) * buttonSpacing;
      const y = centerY - modalHeight * 0.15 + row * 60;

      button.setPosition(x, y).setSize(buttonWidth, 40);
      text.setPosition(x, y);
    });

    // 액션 버튼 위치 업데이트
    const actionButtonWidth = Math.min(200, modalWidth * 0.8);
    this.gameObjects.actionButton
      .setPosition(centerX, centerY + modalHeight * 0.35)
      .setSize(actionButtonWidth, 40);
    this.gameObjects.actionText.setPosition(centerX, centerY + modalHeight * 0.35);
  }

  // 리사이즈 이벤트 핸들러
  handleResize = () => {
    this.updatePositions();
  };

  handlePlayerSelection(playerId, selectedButton, selectedText) {
    const gameData = this.scene.registry.get('gameData');
    this.gameObjects.playerButtons.forEach(({ button, text, index }) => {
      const player = gameData.result.playersInfo[index + 1];
      if (this.isPlayerSelectable(player) && this.selectedPlayer !== playerId) {
        button.setFillStyle(this.getButtonColor(player));
        text.setColor(this.getTextColor(player));
      }
    });

    this.selectedPlayer = playerId;
    selectedButton.setFillStyle(this.getSelectedButtonColor());
    selectedText.setColor(this.getSelectedTextColor());
  }

  // 정리
  destroy() {
    this.scene.scale.off('resize', this.handleResize, this);

    Object.values(this.gameObjects).forEach((obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(({ button, text }) => {
          button.destroy();
          text.destroy();
        });
      } else if (obj.destroy) {
        obj.destroy();
      }
    });
  }
}
