export default function showFixedClock(scene) {
  const eventEmitter = scene.registry.get('eventEmitter');

  // 남은 시간을 표시할 텍스트 객체 추가
  const timeText = scene.add
    .text(scene.cameras.main.width - 150, 10, '남은 시간: --', {
      font: '18px Arial',
      fill: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: { left: 5, right: 5, top: 2, bottom: 2 },
    })
    .setScrollFactor(0)
    .setDepth(100); // 다른 UI 요소보다 위에 표시

  // TIME 이벤트 처리 (남은 시간 업데이트)
  eventEmitter.on('TIME', (data) => {
    try {
      // 남은 시간만 표시
      timeText.setText(`남은 시간: ${data.time}초`);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}
