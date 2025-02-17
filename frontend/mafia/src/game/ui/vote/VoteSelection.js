export default function createVoteSelection(scene, option) {
  // scene.voteSelections가 없으면 초기화
  if (!scene.voteSelections) {
    scene.voteSelections = {};
  }

  const background = scene.rexUI.add.roundRectangle(0, 0, 150, 50, 20, 0xffffff, option ? 1 : 0.3);

  const text = scene.add
    .text(0, 0, option?.nickname || '', {
      fontSize: '18px',
      color: 'black',
    })
    .setOrigin(0.5);

  if (option?.id) {
    scene.voteSelections[option.id] = background;
  }

  const container = scene.rexUI.add
    .overlapSizer({
      width: background.width,
      height: background.height,
    })
    .add(text, {
      align: 'center',
      expand: true,
    })
    .addBackground(background);

  if (option) {
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => background.setStrokeStyle(2, 0xff0000))
      .on('pointerout', () => background.setStrokeStyle())
      .on('pointerdown', () => {
        if (scene.select) {
          scene.select(option.id);
        }
      });
  }

  return container;
}
