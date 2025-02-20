import api from '@/api/axios';

export default class BaseRole {
  constructor(scene) {
    this.scene = scene;
    this.hasVoted = false;
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
      0.9,
    );

    this.gameObjects.border = this.scene.rexUI.add.roundRectangle(0, 0, 500, 400, 20, 0xffffff, 0);

    // 제목 텍스트
    this.createTitle();

    // 플레이어 버튼 생성
    this.createPlayerButtons();

    // 액션 버튼
    this.createActionButton();

    // Skip 버튼
    this.createSkipButton(); // 여기서 skip 버튼을 생성해주어야 합니다.

    // 초기 위치 설정
    this.updatePositions();

    const localPlayerInfo = this.scene.registry.get('playerInfo');
    if (localPlayerInfo.dead || localPlayerInfo.role === '돌연변이') {
      this.handleSkip();
    }
  }

  createSkipButton() {
    // Skip 버튼 (보더의 오른쪽 상단에 위치)
    this.gameObjects.skipButton = this.scene.rexUI.add.roundRectangle(
      0,
      0,
      60, // 버튼 너비를 80으로 줄임
      30, // 버튼 높이를 40으로 줄임
      7,
      0xffffff, // 버튼 색상
    );

    this.gameObjects.skipText = this.scene.add
      .text(0, 0, 'Skip', {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '20px', // 텍스트 크기를 16px로 줄임
        fill: '#000000',
      })
      .setOrigin(0.5);

    this.gameObjects.skipButton.setPosition(
      this.gameObjects.border.x + this.gameObjects.border.width / 2 - 30, // 오른쪽 상단 위치
      this.gameObjects.border.y - this.gameObjects.border.height / 2 + 30,
    );

    // 버튼에 상호작용 추가
    this.gameObjects.skipButton
      .setInteractive()
      .on('pointerover', () => {
        this.gameObjects.skipButton.setFillStyle(0xdcdcdc); // Hover 시 색상 변경
      })
      .on('pointerout', () => {
        this.gameObjects.skipButton.setFillStyle(0xffffff); // Hover 해제 시 색상 복원
      })
      .on('pointerdown', () => {
        this.handleSkip(); // Skip 버튼 클릭 시 handleSkip 호출
      });
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
    const maxButtons = 9;
    const gameData = this.scene.registry.get('gameData');

    for (let i = 0; i < maxButtons; i += 1) {
      const playerNumber = i + 1;
      const player = gameData.result.playersInfo[playerNumber] || null;

      const button = this.scene.rexUI.add.roundRectangle(
        0,
        0,
        160,
        50,
        7,
        player ? this.getButtonColor(player) : 0x2c2c32,
      );

      // Create container for nickname and counter
      const textContainer = this.scene.add.container(0, 0);

      const text = this.scene.add
        .text(0, 0, player ? player.nickname : '', {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '22px',
          fill: player ? this.getTextColor(player) : '#999999',
        })
        .setOrigin(0.5);

      textContainer.add([text]);

      if (player && this.isPlayerSelectable(player)) {
        this.addButtonInteractivity(button, textContainer, player);
      }

      this.gameObjects.playerButtons.push({
        button,
        textContainer,
        text,
        index: i,
        player,
      });
    }
  }

  addButtonInteractivity(button, textContainer, player) {
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
        this.handlePlayerSelection(player.playerNo, button, textContainer, player.role);
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
    if (this.hasVoted) return; // 이미 투표했으면 함수 종료

    const gameData = this.scene.registry.get('gameData');
    if (this.selectedPlayer) {
      const selectedPlayer = gameData.result.playersInfo[this.selectedPlayer];

      // 버튼 비활성화
      this.gameObjects.playerButtons.forEach(({ button, text }) => {
        button.removeInteractive();
        button.setFillStyle(0x666666);
        text.setColor('#999999');
      });

      // 투표 완료 상태로 변경
      this.hasVoted = true;

      // 결과 처리는 하위 클래스에서 구현
      if (typeof this.selectedResult === 'function') {
        this.selectedResult(selectedPlayer);
      } else {
        console.log('selectedResult is not implemented in this class');
      }

      // 서버에 투표 정보 전송
      try {
        const roomId = this.scene.registry.get('roomId');
        const playerNo = this.scene.registry.get('playerNo');
        const response = await api.post(
          `/api/game/${roomId}/vote?playerNo=${playerNo}&targetNo=${this.selectedPlayer}`,
        );
        // 서버 응답 처리
        console.log('투표 전송 성공:', response.data);
      } catch (error) {
        console.log('투표 전송 실패:', error.response?.data?.message || error.message);
        this.showMessage(error.response?.data?.message || '투표 전송 실패');
      }
    }
  };

  handleSkip() {
    // 버튼 비활성화
    this.gameObjects.playerButtons.forEach(({ button, text }) => {
      button.removeInteractive();
      button.setFillStyle(0x666666);
      text.setColor('#999999');
    });

    this.gameObjects.actionButton.removeInteractive().setFillStyle(0x666666);
    this.gameObjects.actionText.setColor('#999999');
    this.gameObjects.skipButton.removeInteractive().setFillStyle(0x666666);
    this.gameObjects.skipText.setColor('#999999');
  }

  showMessage(text) {
    const cameraCenterX = this.scene.cameras.main.centerX; // 카메라 중심 X
    const cameraCenterY = this.scene.cameras.main.centerY; // 카메라 중심 Y

    const message = this.scene.add
      .text(cameraCenterX, cameraCenterY, text, {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '36px',
        fill: '#ffffff',
        backgroundColor: '#ff0000',
        padding: { x: 20, y: 20 },
      })
      .setOrigin(0.5) // 텍스트의 중심을 기준으로 위치 설정
      .setDepth(100);

    this.scene.time.delayedCall(2000, () => message.destroy()); // 2초 후 텍스트 삭제
  }

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

    const rows = 3;
    const cols = 3;
    const buttonWidth = Math.min(150, (modalWidth - 60) / cols);
    const buttonSpacing = buttonWidth + 20;

    this.gameObjects.playerButtons.forEach(({ button, textContainer, index }) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = centerX + (col - (cols - 1) / 2) * buttonSpacing;
      const y = centerY - modalHeight * 0.15 + row * 60;

      button.setPosition(x, y).setSize(buttonWidth, 40);
      textContainer.setPosition(x, y);
    });

    // 액션 버튼 위치 업데이트
    const actionButtonWidth = Math.min(200, modalWidth * 0.8);
    this.gameObjects.actionButton
      .setPosition(centerX, centerY + modalHeight * 0.35)
      .setSize(actionButtonWidth, 40);
    this.gameObjects.actionText.setPosition(centerX, centerY + modalHeight * 0.35);

    // Skip 버튼 위치 업데이트 (오른쪽 상단)
    this.gameObjects.skipButton.setPosition(
      centerX + modalWidth / 2 - 50, // 오른쪽 끝에서 50px 여유
      centerY - modalHeight / 2 + 30, // y값을 30으로 설정하여 위쪽에서 30px 내려간 위치
    );
    this.gameObjects.skipText.setPosition(
      this.gameObjects.skipButton.x,
      this.gameObjects.skipButton.y,
    );
  }

  // 리사이즈 이벤트 핸들러
  handleResize = () => {
    this.updatePositions();
  };

  handlePlayerSelection(playerNumber, selectedButton) {
    const prevSelected = this.selectedPlayer;

    // Handle new selection
    if (prevSelected !== playerNumber) {
      this.selectedPlayer = playerNumber;
      const selectedButtonObj = this.gameObjects.playerButtons.find(
        (btn) => btn.player && btn.player.playerNo === playerNumber,
      );
      selectedButton.setFillStyle(this.getSelectedButtonColor());
      selectedButtonObj.text.setColor(this.getSelectedTextColor());
    } else {
      // Deselect if clicking the same player
      this.selectedPlayer = null;
      selectedButton.setFillStyle(
        this.getButtonColor(
          this.gameObjects.playerButtons.find(
            (btn) => btn.player && btn.player.playerNo === playerNumber,
          ).player,
        ),
      );
      const selectedButtonObj = this.gameObjects.playerButtons.find(
        (btn) => btn.player && btn.player.playerNo === playerNumber,
      );
      selectedButtonObj.text.setColor(this.getTextColor(selectedButtonObj.player));
    }

    // Update all other buttons
    this.gameObjects.playerButtons.forEach(({ button, text, player }) => {
      if (!player || player.playerNo === playerNumber) return;

      if (this.isPlayerSelectable(player)) {
        button.setFillStyle(this.getButtonColor(player));
        text.setColor(this.getTextColor(player));
      }
    });
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
