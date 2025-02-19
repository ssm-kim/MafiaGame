import Phaser from 'phaser';
import showFixedClock from '@/game/ui/clock/BaseClock';
import setBackground from '@/game/utils/map';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
import CitizenRole from '@/game/ui/role/CitizenRole';
import getGameData from '@/game/utils/gameData';

export default class VoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VoteScene' });
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
    this.role = new CitizenRole(this);
  }
}
