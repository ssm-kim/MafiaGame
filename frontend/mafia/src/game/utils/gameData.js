import api from '@/api/axios';
import PlayerRole from '@/types/role';

const getGameData = async (scene) => {
  try {
    const setSubscriptions = scene.registry.get('setSubscriptions');

    const roomId = scene.registry.get('roomId');
    const response = await api.get(`/api/game/${roomId}`);

    if (response.data.result.gamestatus !== 'PLAYING') {
      scene.scene.start('GameOverScene', response.data.result.gamestatus);
    }

    const localPlayerInfo = response.data.result.myInfo;
    setSubscriptions(localPlayerInfo.subscriptions, true);

    const { playersInfo } = response.data.result;

    const newPlayerInfo = {
      ...localPlayerInfo,
      playerNo: localPlayerInfo.playerNo,
      nickname: localPlayerInfo.nickname,
      role: PlayerRole[localPlayerInfo.role],
      character: `character${(localPlayerInfo.playerNo % 4) + 1}`,
    };

    // 데이터를 레지스트리에 저장
    scene.registry.set('playersInfo', playersInfo);
    scene.registry.set('playerInfo', newPlayerInfo);

    // Phaser 씬의 registry에 저장
    scene.registry.set('gameData', response.data);
  } catch (error) {
    console.error('게임 데이터를 불러오는 중 오류 발생:', error.message);
  }
};

export default getGameData;
