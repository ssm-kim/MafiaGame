export default function sceneChanger(scene) {
  const eventEmitter = scene.registry.get('eventEmitter');

  // 이전 phase를 저장할 변수 추가
  let previousPhase = null;

  const phaseMapping = {
    DAY_DISCUSSION: 'MainScene',
    DAY_VOTE: 'VoteScene',
    DAY_FINAL_STATEMENT: 'StatementScene',
    DAY_FINAL_VOTE: 'LastVoteScene',
    NIGHT_ACTION: 'NightScene',
  };

  eventEmitter.on('TIME', (data) => {
    try {

      // phase가 이전과 다를 때만 scene 변경
      if (data.phase !== previousPhase) {
        const newSceneKey = phaseMapping[data.phase];
        const currentSceneKey = scene.scene.key;

        console.log(`Phase changed from ${previousPhase} to ${data.phase}`);
        console.log(`Current Scene: ${currentSceneKey}, New Scene: ${newSceneKey}`);

        if (newSceneKey !== currentSceneKey) {
          scene.scene.stop(currentSceneKey);
          scene.scene.start(newSceneKey);
          // 현재 phase를 이전 phase로 저장
        }
      }
      previousPhase = data.phase;
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}