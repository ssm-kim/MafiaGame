import Player from '@/game/player/Player';
import { PlayerData } from '@/types/game';

export default class PlayerManager {
  localPlayerInfo: PlayerData;

  constructor(scene, localPlayerInfo) {
    this.scene = scene;
    this.localPlayerInfo = localPlayerInfo;

    this.players = new Map();
    this.localPlayer = null;

    this.setupPhaserEventListeners();
    this.createLocalPlayer();
  }

  setupPhaserEventListeners() {
    const eventEmitter = this.scene.registry.get('eventEmitter');

    // events.on('CONNECTED', this.createLocalPlayer.bind(this));
    eventEmitter.on('PLAYER_DATA_UPDATED', this.updateCharacters.bind(this));
  }

  createLocalPlayer() {
    if (this.localPlayer) return;

    const userId = this.scene.registry.get('userId');

    const data = {
      nickname: this.localPlayerInfo.nickname,
      character: this.localPlayerInfo.character,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      lastDirection: 'down',
      isLocal: true,
    };

    const player = new Player(this.scene, data);
    this.localPlayer = player;

    this.players.set(userId, player);
    this.scene.socketService.sendPosition(data);
  }

  createPlayer(playerId: number, playerData: PlayerData) {
    const userData = this.scene.playersData[playerId];

    const data = {
      ...playerData,
      nickname: userData.nickname,
      isLocal: false,
    };

    const player = new Player(this.scene, data);

    this.scene.physics.add.collider(
      player,
      this.localPlayer,
      this.scene.handleCollision,
      null,
      this,
    );

    this.players.set(playerId, player);
  }

  updateCharacters(positions) {
    Object.keys(positions).forEach((playerId) => {
      const numericId = parseInt(playerId, 10);
      if (numericId === this.localPlayerInfo.playerId) {
        return;
      }

      const playerData = positions[playerId];
      const player = this.players.get(numericId);

      if (!player) {
        this.createPlayer(playerId, playerData);
        return;
      }

      this.scene.tweens.add({
        targets: player,
        duration: 100,
        ease: 'Linear',
      });

      player.nonLocalMove({
        x: playerData.x,
        y: playerData.y,
        velocityX: playerData.velocityX,
        velocityY: playerData.velocityY,
      });

      if (Math.abs(player.x - playerData.x) > 3 || Math.abs(player.y - playerData.y) > 3) {
        player.setPosition(playerData.x, playerData.y);
      }
    });
  }

  update() {
    this.localPlayer?.move();
  }
}
