import createVoteSelection from '@/game/ui/VoteSelection';

export default function createVoteContainer(scene, x, y, width, height, options) {
  const cardCount = options.length > 8 ? 12 : 8;

  const background = scene.rexUI.add.roundRectangle(0, 0, width, height, 20, 0x000000, 0.8);

  const header = scene.rexUI.add.overlapSizer({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const title = scene.add
    .text(0, 0, '투표할 대상을 선택하세요.', { fontSize: '24px', color: 'white' })
    .setPadding(20);
  const skipButton = scene.rexUI.add.label({
    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0xffffff),
    text: scene.add.text(0, 0, '스킵', { color: 'black' }),
    align: 'center',
    space: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 10,
    },
  });

  skipButton
    .setInteractive({ useHandCursor: true })
    .on('pointerover', function () {
      this.getElement('background').setStrokeStyle(2, 0xff0000);
    })
    .on('pointerout', function () {
      this.getElement('background').setStrokeStyle();
    })
    .on('pointerdown', () => {
      console.log('skip 버튼을 눌렀습니다.');
    });

  header
    .add(title, {
      align: 'center',
      expand: false,
    })
    .add(skipButton, {
      align: 'right',
      expand: false,
      offsetX: -10,
    });

  const sizer = scene.rexUI.add
    .sizer(x, y, width, height, { orientation: 'y' })
    .addBackground(background)
    .add(header, { align: 'center', expand: true });
  const gridSizer = scene.rexUI.add.gridSizer({
    column: 4,
    row: cardCount / 4,
    columnProportions: 1,
    rowProportions: 1,
    space: { left: 10, right: 10, top: 10, bottom: 10 },
  });

  for (let i = 0; i < cardCount; i += 1) {
    gridSizer.add(createVoteSelection(scene, options[i]), { padding: 10, expand: true });
  }

  sizer.add(gridSizer, { proportion: 1, expand: true });
  sizer.layout();

  return sizer;
}
