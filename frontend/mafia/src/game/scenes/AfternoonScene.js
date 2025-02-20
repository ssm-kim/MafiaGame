import Phaser from 'phaser';

export default class AfternoonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AternoonScene' });
  }

  create() {
    // 어두운 반투명 배경 오버레이
    const overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7,
    );
    overlay.setOrigin(0);

    // 다이얼로그 생성
    const nightEventDialog = this.rexUI.add
      .dialog({
        x: this.cameras.main.centerX,
        y: this.cameras.main.centerY,
        background: this.rexUI.add.roundRectangle(0, 0, 400, 300, 20, 0x2d2d2d),
        title: this.createTitle('밤 사이의 사건'),
        content: this.createContent('지난 밤 마피아가 [피해자 이름]을 살해했습니다.'),
        actions: [this.createButton('확인')],
        space: {
          title: 25,
          content: 25,
          action: 15,
          left: 20,
          right: 20,
          top: 20,
          bottom: 20,
        },
        align: {
          actions: 'center',
        },
      })
      .layout()
      .popUp(1000);

    // 확인 버튼 클릭 이벤트
    nightEventDialog.on(
      'button.click',
      function (button) {
        nightEventDialog.scaleDownDestroy(500);
        overlay.destroy();
      },
      this,
    );
  }

  createTitle(text) {
    return this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
  }

  createContent(text) {
    return this.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 340 },
    });
  }

  createButton(text) {
    return this.rexUI.add.label({
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x4e4e4e),
      text: this.add.text(0, 0, text, {
        fontSize: '18px',
        color: '#FFFFFF',
      }),
      space: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    });
  }
}
