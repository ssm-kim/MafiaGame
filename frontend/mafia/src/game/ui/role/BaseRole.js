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

    this.players.forEach((player, index) => {
      const button = this.scene.rexUI.add.roundRectangle(
        0,
        0,
        160,
        50,
        7,
        this.getButtonColor(player),
      );

      const text = this.scene.add
        .text(0, 0, player.nickname, {
          fontFamily: 'BMEuljiro10yearslater',
          fontSize: '20px',
          fill: this.getTextColor(player),
        })
        .setOrigin(0.5);

      if (this.isPlayerSelectable(player)) {
        this.addButtonInteractivity(button, text, player);
      }

      this.gameObjects.playerButtons.push({ button, text, index, role: player.role });
    });
  }

  // 버튼 상호작용 추가
  addButtonInteractivity(button, text, player) {
    button
      .setInteractive()
      .on('pointerover', () => {
        if (this.selectedPlayer !== player.userId) {
          button.setFillStyle(this.getHoverColor());
        }
      })
      .on('pointerout', () => {
        if (this.selectedPlayer !== player.userId) {
          button.setFillStyle(this.getButtonColor(player));
        }
      })
      .on('pointerdown', () => {
        this.handlePlayerSelection(player.userId, button, text, player.role);
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

  handleVote() {
    if (this.selectedPlayer) {
      const selectedPlayer = this.players.find((player) => player.userId === this.selectedPlayer);

      // 버튼 비활성화
      this.gameObjects.playerButtons.forEach(({ button, text }) => {
        button.removeInteractive();
        button.setFillStyle(0x666666);
        text.setColor('#999999');
      });

      // 결과 처리는 하위 클래스에서 구현
      this.selcetedResult(selectedPlayer);
    }
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

    // 플레이어 버튼 위치 업데이트
    const cols = screenWidth < 600 ? 2 : 3;
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
    this.gameObjects.playerButtons.forEach(({ button, text, index }) => {
      const player = this.players[index];
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
