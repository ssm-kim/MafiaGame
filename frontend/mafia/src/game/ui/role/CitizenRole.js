export default class CitizenRole {
  constructor(scene) {
    this.scene = scene;
    this.gameObjects = {};
    this.createUI();

    // 리사이즈 이벤트 리스너 등록
    this.scene.scale.on('resize', this.handleResize, this);
  }

  createUI() {
    // 어두운 배경 오버레이
    this.gameObjects.background = this.scene.rexUI.add.roundRectangle(
      0,
      0,
      500,
      400,
      20,
      0x000000,
      0,
    );

    // 메시지 텍스트
    this.gameObjects.messageText = this.scene.add
      .text(0, 0, '감염자가 활동 중입니다.', {
        fontFamily: 'BMEuljiro10yearslater',
        fontSize: '36px',
        fill: '#ff0000',
        align: 'center',
      })
      .setOrigin(0.5);

    this.updatePositions();
  }

  updatePositions() {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    this.gameObjects.background.setPosition(centerX, centerY).setSize(screenWidth, screenHeight);
    this.gameObjects.messageText.setPosition(centerX, centerY);
  }

  handleResize = () => {
    this.updatePositions();
  };

  destroy() {
    // 리사이즈 이벤트 리스너 제거
    this.scene.scale.off('resize', this.handleResize, this);

    // 게임 오브젝트들 제거
    Object.values(this.gameObjects).forEach((object) => {
      if (object.destroy) {
        object.destroy();
      }
    });
  }
}
