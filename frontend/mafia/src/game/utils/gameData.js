import axios from 'axios';

export const getGameData = async (scene) => {
  try {
    const response = await axios.get(`http://localhost:8080/api/game/2`, {
      withCredentials: true, // 쿠키 포함 옵션
    });

    console.log('게임 데이터:', response.data);

    // Phaser 씬의 registry에 저장
    scene.registry.set('gameData', response.data);

    return response.data;
  } catch (error) {
    console.error('게임 데이터를 불러오는 중 오류 발생:', error.message);
    return null;
  }
};
