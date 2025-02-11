export default function showFixedRoleText(scene) {
  // 역할에 따라 문구 색상 설정
  let textColor;
  if (scene.playerInfo.role === '감염자') {
    textColor = '#ff0000'; // 빨간색
  } else if (scene.playerInfo.role === '돌연변이') {
    textColor = '#aeb404'; // 노란색
  } else {
    textColor = '#ffffff'; // 기본 흰색
  }

  // 좌측 상단에 역할 문구 표시
  const fixedRoleText = scene.add.text(10, 10, `${scene.playerInfo.role}`, {
    font: '20px Arial',
    fill: textColor,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: { left: 5, right: 5, top: 5, bottom: 2 },
  });

  // 문구를 화면 좌측 상단에 고정
  fixedRoleText.setScrollFactor(0);

  return fixedRoleText;
}
