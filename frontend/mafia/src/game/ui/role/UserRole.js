export default function showFixedRoleText(scene) {
  const gameData = scene.registry.get('gameData');

  const roleMapping = {
    ZOMBIE: '감염자',
    MUTANT: '돌연변이',
    POLICE: '연구원',
    PLAGUE_DOCTOR: '의사',
    CITIZEN: '생존자',
  };

  const role = roleMapping[gameData.result.myInfo.role];

  // 역할에 따라 문구 색상 설정
  let textColor;
  if (gameData.result.myInfo.role === 'ZOMBIE') {
    textColor = '#ff0000'; // 빨간색
  } else if (gameData.result.myInfo.role === 'MUTANT') {
    textColor = '#aeb404'; // 노란색
  } else {
    textColor = '#ffffff'; // 기본 흰색
  }

  // 좌측 상단에 역할 문구 표시
  const fixedRoleText = scene.add.text(10, 10, role, {
    font: '20px Arial',
    fill: textColor,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: { left: 5, right: 5, top: 5, bottom: 2 },
  });

  // 문구를 화면 좌측 상단에 고정
  fixedRoleText.setScrollFactor(0);

  return fixedRoleText;
}
