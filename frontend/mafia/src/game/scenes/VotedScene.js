import Phaser from 'phaser';
import showFixedClock from '@/game/ui/clock/BaseClock';
import setBackground from '@/game/utils/map';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
import CitizenRole from '@/game/ui/role/CitizenRole';
import { getGameData } from '@/game/utils/gameData';

export default class VoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VotedScene' });
  }

  create() {
    setBackground(this);
    showFixedRoleText(this);
    showFixedClock(this);
    sceneChanger(this);
    getGameData(this);
    this.assignRoles();
  }

  assignRoles() {
    const gameData = this.registry.get('gameData');
    const { role } = gameData.result.myInfo;

    if (role !== 'ZOMBIE') {
      // 특수 역할 UI 생성
      this.role = new CitizenRole(this);
      //   } else {
      //     this.role = new PoliceRole(this, [role]);
    }
  }
}
