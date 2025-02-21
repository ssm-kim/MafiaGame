import Phaser from 'phaser';

function showNightActionResult(scene, text) {
  const { width, height } = scene.scale.gameSize;
  scene.cameras.main.fadeIn(1000, 0, 0, 0);

  scene.add
    .text(width / 2, height / 2, text, {
      font: '28px Arial',
      fill: '#ffffff',
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: { left: 10, right: 10, top: 5, bottom: 5 },
    })
    .setOrigin(0.5);

  scene.time.delayedCall(2500, () => {
    scene.cameras.main.fadeOut(1000);
  });

  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start('MainScene');
  });
}

export default showNightActionResult;
