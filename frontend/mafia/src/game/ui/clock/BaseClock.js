export default function showFixedClock(scene) {
  const sceneEventEmitter = scene.registry.events;

  // 남은 시간을 표시할 텍스트 객체 추가
  const timeText = scene.add
    .text(scene.cameras.main.width - 150, 10, `남은 시간: --`, {
      font: '18px Arial',
      fill: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: { left: 5, right: 5, top: 2, bottom: 2 },
    })
    .setScrollFactor(0)
    .setDepth(99999); // 다른 UI 요소보다 위에 표시

  sceneEventEmitter.on('changedata-remainingTime', (parent, value) => {
    if (!timeText) return;
    timeText.setText(`남은 시간: ${value}`);
  });

  scene.events.on('shutdown', () => {
    sceneEventEmitter.removeAllListeners();
    timeText?.destroy();
  });

  return timeText;
}
