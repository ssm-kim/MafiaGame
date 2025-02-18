import axios from 'axios';
import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import PlayerManager from '@/game/player/PlayerManager';
import sceneChanger from '@/game/utils/sceneChange';
import showFixedRoleText from '@/game/ui/role/UserRole';
import showFixedClock from '@/game/ui/clock/BaseClock';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'MainScene',
    });

    this.players = new Map();
    // this.remainingTime = sceneTimeout.DAY_DISCUSSION;
  }

  init() {
    const gameData = this.registry.get('gameData');
    const playerInfo = gameData.result.playersInfo;
    this.roomId = this.registry.get('roomId');

    const { role, character } = playerInfo;
    this.role = role;
    this.character = character;

    this.socketService = this.registry.get('socketService');
    this.playerManager = new PlayerManager(this, playerInfo);
  }

  create() {
    // 배경 설정
    setBackground(this);
    showFixedClock(this);
    showFixedRoleText(this);
    sceneChanger(this);
    // 렌더링 최적화
    this.game.renderer.roundPixels = true;
  }

  update() {
    // 로컬 플레이어 업데이트
    if (this.playerManager.localPlayer) {
      this.playerManager.localPlayer.move();
    }
  }
}
