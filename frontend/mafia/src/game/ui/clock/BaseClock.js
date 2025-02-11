export default function showFixedClock(scene) {
  const duration = 30;

  this.add
    .text(this.cameras.main.width - 150, 10, `남은 시간: ${duration}`, {
      font: '18px Arial',
      fill: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: { left: 5, right: 5, top: 2, bottom: 2 },
    })
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.scene.start('NightScene');
    }); // 카메라 고정
}
