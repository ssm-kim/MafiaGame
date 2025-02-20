export default function sceneChanger(scene) {
  const eventEmitter = scene.registry.get('eventEmitter');
  const playersInfo = scene.registry.get('playersInfo');

  // 이전 phase를 저장할 변수 추가
  let previousPhase = scene.scene.key;
  let voteResult = null;
  let afternoonMessage = '';

  const phaseMapping = {
    DAY_DISCUSSION: 'MainScene',
    DAY_VOTE: 'VoteScene',
    DAY_FINAL_STATEMENT: 'StatementScene',
    DAY_FINAL_VOTE: 'LastVoteScene',
    NIGHT_ACTION: 'NightScene',
  };

  scene.events.on('shutdown', () => {
    eventEmitter.removeAllListeners();

    // BGM 정리
    if (scene.bgmController) {
      scene.bgmController.stop();
    }
    if (scene.registry.get('currentBGM')) {
      scene.registry.get('currentBGM').stop();
      scene.registry.remove('currentBGM');
    }

    eventEmitter.removeAllListeners();
  });

  eventEmitter.on('SYSTEM_MESSAGE', (data) => {
    try {
      if (!data) return;

      if (!data.phase) {
        console.log(data);
      }

      if (data.phase && data.time) {
        scene.registry.set('remainingTime', data.time);
        // phase가 이전과 다를 때만 scene 변경
        if (previousPhase !== null && data.phase !== previousPhase) {
          const newSceneKey = phaseMapping[data.phase];
          const currentSceneKey = scene.scene.key;

          if (newSceneKey !== currentSceneKey) {
            eventEmitter.removeAllListeners();
            scene.scene.stop(currentSceneKey);
            scene.scene.start(newSceneKey);
            // 현재 phase를 이전 phase로 저장
          }
        }
        previousPhase = data.phase;
      }

      if (data.voteresult) {
        voteResult = data.voteresult;
        scene.registry.set('voteResult', data.voteresult);
      }

      if (data.death || data.heal) {
        const allDeath = data.death?.split(', ');

        const localPlayerInfo = scene.registry.get('playerInfo');

        if (allDeath.includes(String(localPlayerInfo.playerNo))) {
          const newLocalPlayerInfo = {
            ...localPlayerInfo,
            dead: true,
          };

          scene.registry.set('playerInfo', newLocalPlayerInfo);

          afternoonMessage = '당신이 사망하였습니다.';
          scene.registry.set('afternoonMessage', afternoonMessage);

          return;
        }

        if (!allDeath?.length && data.heal) {
          afternoonMessage = `${playersInfo[data.heal].nickname}님이 의문의 공격을 받았으나\n\n의사가 치료하여 살아남았습니다.`;
        } else if (allDeath?.length === 1) {
          afternoonMessage = `${playersInfo[allDeath[0]].nickname}님은 의문의 공격을 받아\n\n사망하였습니다.`;
        } else if (allDeath?.length === 2) {
          afternoonMessage = `${playersInfo[allDeath[0]].nickname}님과 ${playersInfo[allDeath[1]].nickname}님은\n\n의문의 공격을 받아 사망하였습니다.`;
        } else {
          afternoonMessage = '밤 사이에 아무 일도 일어나지 않았습니다.';
        }

        scene.registry.set('afternoonMessage', afternoonMessage);
      }

      if (voteResult) {
        afternoonMessage = '밤 사이에 아무 일도 일어나지 않았습니다.';
        scene.registry.set('afternoonMessage', afternoonMessage);
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}
