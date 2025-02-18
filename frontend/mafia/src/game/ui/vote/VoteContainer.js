// 좀비 테마 스타일 정의
const ZOMBIE_THEME = {
  colors: {
    background: 0x1a0f0f, // 어두운 붉은 배경
    containerBg: 0x000000, // 검은 배경
    blood: 0x8b0000, // 진한 피 색상
    bloodLight: 0xff0000, // 밝은 피 색상
    hover: 0x2d1f1f, // 호버 색상
    text: '#ffffff', // 기본 텍스트
    textHighlight: '#ff3333', // 강조 텍스트
  },
  gradients: {
    blood: ['#8b0000', '#ff0000'],
    dark: ['#1a0f0f', '#000000'],
  },
};

export default function createVoteContainer(scene, x, y, width, height, options) {
  const playerCount = options.length;
  const containerWidth = width * 0.6;
  const containerHeight = height * 0.7;

  // 메인 컨테이너 배경
  const background = scene.rexUI.add
    .roundRectangle(
      0,
      0,
      containerWidth,
      containerHeight,
      20,
      ZOMBIE_THEME.colors.containerBg,
      0.95,
    )
    .setStrokeStyle(4, ZOMBIE_THEME.colors.blood);

  // "감염자 투표" 텍스트
  const title = scene.add
    .text(0, 0, '감염자 투표', {
      fontSize: '32px',
      color: ZOMBIE_THEME.colors.textHighlight,
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: ZOMBIE_THEME.colors.blood,
        blur: 10,
        stroke: true,
        fill: true,
      },
    })
    .setPadding(15);

  // 제목 텍스트 떨림 효과
  scene.tweens.add({
    targets: title,
    y: '+=2',
    duration: 100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  // 그리드 설정
  const columns = 3;
  const rows = Math.ceil(playerCount / columns);
  const gridSizer = scene.rexUI.add.gridSizer({
    column: columns,
    row: rows,
    columnProportions: 1,
    rowProportions: 1,
    space: {
      left: 20,
      right: 20,
      top: 15,
      bottom: 15,
      column: 15,
      row: 15,
    },
  });

  // 버튼 스타일
  const buttonStyle = {
    width: containerWidth * 0.35,
    height: 60,
    backgroundColor: ZOMBIE_THEME.colors.background,
    fontSize: '22px',
    padding: { left: 15, right: 15, top: 10, bottom: 10 },
  };

  // 버튼 배열
  gridSizer.buttons = [];
  const gameData = scene.registry.get('gameData');
  // 플레이어 버튼 생성
  for (let i = 0; i < playerCount; i++) {
    if (options[i]) {
      const playerNumber = i + 1;
      const { nickname } = gameData.result.playersInfo[playerNumber] || { nickname: '' };
      const { playerNo } = gameData.result.playersInfo[playerNumber] || { playerNo: '' }; // playerNo 추가
      const button = createZombieButton(scene, `${nickname}`, playerNo, buttonStyle, gridSizer);
      gridSizer.add(button, {
        column: i % columns,
        row: Math.floor(i / columns),
        expand: true,
      });
      gridSizer.buttons.push(button);
    }
  }
  // 투표 버튼 (피 묻은 스타일)
  const voteButton = scene.rexUI.add
    .label({
      background: scene.rexUI.add
        .roundRectangle(0, 0, containerWidth * 0.5, 50, 10, ZOMBIE_THEME.colors.blood)
        .setStrokeStyle(2, ZOMBIE_THEME.colors.bloodLight),
      text: scene.add.text(0, 0, '처형하기', {
        fontSize: '24px',
        color: ZOMBIE_THEME.colors.text,
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 2,
      }),
      space: { left: 20, right: 20, top: 10, bottom: 10 },
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerover', function () {
      this.getElement('background')
        .setFillStyle(ZOMBIE_THEME.colors.bloodLight)
        .setStrokeStyle(2, ZOMBIE_THEME.colors.blood);

      // 호버 시 떨림 효과
      scene.tweens.add({
        targets: this,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    })
    .on('pointerout', function () {
      this.getElement('background')
        .setFillStyle(ZOMBIE_THEME.colors.blood)
        .setStrokeStyle(2, ZOMBIE_THEME.colors.bloodLight);
    })
    .on('pointerdown', () => {
      scene.submitVote();

      // 강한 화면 흔들림
      scene.cameras.main.shake(500, 0.008);

      // 빨간색 플래시
      scene.cameras.main.flash(300, 255, 0, 0, 0.4);

      // 처형 버튼 펄스 효과
      scene.tweens.add({
        targets: voteButton,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        repeat: 1,
      });
    });

  // 컨테이너 구성
  const sizer = scene.rexUI.add
    .sizer(x, y, containerWidth, containerHeight, { orientation: 'y' })
    .addBackground(background)
    .add(title, {
      align: 'center',
      expand: false,
      padding: { top: 20, bottom: 15 },
    })
    .add(gridSizer, {
      align: 'center',
      expand: true,
      padding: { left: 15, right: 15 },
    })
    .add(voteButton, {
      align: 'center',
      padding: { top: 15, bottom: 25 },
    });

  sizer.layout();
  return sizer;
}

function createZombieButton(scene, text, playerNo, style, gridSizer) {
  const button = scene.rexUI.add
    .label({
      background: scene.rexUI.add
        .roundRectangle(0, 0, style.width, style.height, 10, ZOMBIE_THEME.colors.background)
        .setStrokeStyle(2, ZOMBIE_THEME.colors.blood),
      text: scene.add
        .text(0, 0, text, {
          fontSize: style.fontSize,
          color: ZOMBIE_THEME.colors.text,
          fontFamily: 'Arial',
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0.5, 0.5), // 중앙 정렬
      space: style.padding,
      align: 'center', // 라벨 내부 요소 정렬
    })
    .setInteractive({ useHandCursor: true });

  button.playerNumber = playerNo;

  // 게임 데이터에서 해당 플레이어의 죽음 상태 확인
  const gameData = scene.registry.get('gameData');
  const isDead = gameData.result.playersInfo[button.playerNumber]?.dead;

  button
    .on('pointerover', function () {
      if (!this.selected) {
        // 호버 시 떨림 효과
        scene.tweens.add({
          targets: this,
          x: '+=1',
          y: '+=1',
          duration: 50,
          yoyo: true,
          repeat: 3,
        });

        this.getElement('background')
          .setFillStyle(ZOMBIE_THEME.colors.hover)
          .setStrokeStyle(2, ZOMBIE_THEME.colors.bloodLight);

        this.getElement('text').setColor(ZOMBIE_THEME.colors.textHighlight);
      }
    })
    .on('pointerout', function () {
      if (!this.selected) {
        this.getElement('background')
          .setFillStyle(ZOMBIE_THEME.colors.background)
          .setStrokeStyle(2, ZOMBIE_THEME.colors.blood);

        this.getElement('text').setColor(ZOMBIE_THEME.colors.text);
      }
    })
    .on('pointerdown', function () {
      // 화면 흔들림 효과
      scene.cameras.main.shake(200, 0.003);

      // 클릭 시 플래시 효과
      scene.cameras.main.flash(100, 128, 0, 0, 0.3);

      gridSizer.buttons.forEach((btn) => {
        if (btn !== this && btn.selected) {
          btn.selected = false;
          btn
            .getElement('background')
            .setFillStyle(ZOMBIE_THEME.colors.background)
            .setStrokeStyle(2, ZOMBIE_THEME.colors.blood);
          btn.getElement('text').setColor(ZOMBIE_THEME.colors.text);
        }
      });

      this.selected = !this.selected;

      if (this.selected) {
        this.getElement('background')
          .setFillStyle(ZOMBIE_THEME.colors.blood)
          .setStrokeStyle(2, ZOMBIE_THEME.colors.bloodLight);
        this.getElement('text').setColor(ZOMBIE_THEME.colors.textHighlight);
      } else {
        this.getElement('background')
          .setFillStyle(ZOMBIE_THEME.colors.background)
          .setStrokeStyle(2, ZOMBIE_THEME.colors.blood);
        this.getElement('text').setColor(ZOMBIE_THEME.colors.text);
      }

      scene.handlePlayerSelection(this.playerNumber);
    });

  // 플레이어가 죽은 상태라면 버튼 비활성화 및 회색으로 설정
  console.log(isDead)
  if (isDead) {
    button
      .getElement('background')
      .setFillStyle(0x808080) // 회색으로 변경
      .setStrokeStyle(2, 0x6b6b6b); // 어두운 회색 테두리

    button.getElement('text').setColor(0x666666); // 텍스트를 더 어두운 회색으로 설정
    button.setInteractive(false); // 클릭할 수 없도록 설정
  }
  return button;
}
