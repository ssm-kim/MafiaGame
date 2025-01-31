export default function getRandomCharacter() {
  const characters = ['character1', 'character2', 'character3', 'character4', 'character5'];

  // 랜덤으로 캐릭터 선택
  const randomIndex = Math.floor(Math.random() * characters.length);
  const selectedCharacter = characters[randomIndex];

  return selectedCharacter;
}
