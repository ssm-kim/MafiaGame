import Phaser from 'phaser';
import showFixedClock from '@/game/ui/clock/BaseClock';
import setBackground from '@/game/utils/map';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
import CitizenRole from '@/game/ui/role/CitizenRole';
import getGameData from '@/game/utils/gameData';
import BGMController from '@/game/utils/BGMController';

export default class VoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VoteScene' });
  }

  init() {
    const gameData = this.registry.get('gameData');
    const gameResult = gameData.result.gamestatus; // 게임 상태 확인
    //console.log(gameResult);
  }

  create() {
    setBackground(this);
    showFixedRoleText(this);
    showFixedClock(this);
    // bgm
    this.bgmController = new BGMController(this);
    this.bgmController.playBGM('vote_bgm');
    sceneChanger(this);
    getGameData(this);
    this.assignRoles();
  }

  assignRoles() {
    this.role = new CitizenRole(this);
  }

  shutdown() {
    if (this.bgmController) {
      this.bgmController.stop();
    }
    // 추가적인 정리
    if (this.registry.get('currentBGM')) {
      this.registry.get('currentBGM').stop();
      this.registry.remove('currentBGM');
    }
  }

  destroy() {
    if (this.bgmController) {
      this.bgmController.stop();
    }
    super.destroy();
  }
}
