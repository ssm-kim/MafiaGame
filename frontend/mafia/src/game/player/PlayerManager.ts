import { CompatClient } from '@stomp/stompjs';
import Player from '@/game/player/Player';

export default class PlayerManager {
  constructor(scene) {
    this.scene = scene;
    this.localPlayerInfo = this.scene.registry.get('playerInfo');

    this.players = new Map();
    this.localPlayer = null;

    this.setupPhaserEventListeners();
    this.createLocalPlayer();
  }

  setupPhaserEventListeners() {
    const eventEmitter = this.scene.registry.get('eventEmitter');

    eventEmitter.on('PLAYER_DATA_UPDATED', this.updateCharacters.bind(this));
  }

  createLocalPlayer() {
    if (this.localPlayer) return;

    console.log(this.localPlayerInfo);

    const roomId = this.scene.registry.get('roomId');
    const userId = this.scene.registry.get('userId');

    const data = {
      ...this.localPlayerInfo,
      isLocal: true,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      lastDirection: 'down',
    };

    const player = new Player(this.scene, data);
    this.localPlayer = player;

    const stompClient: CompatClient = this.scene.registry.get('stompClient');
    stompClient.send(`/app/game/${roomId}/pos`, {}, JSON.stringify(data));

    this.players.set(userId, player);
  }

  createPlayer(playerId: number, playerData: PlayerData) {
    const playersData = this.scene.registry.get('playersInfo');
    const userData = playersData[playerId];

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

  updateCharacters(data) {
    if (data.playerNo === this.localPlayerInfo.playerNo) return;

    const player = this.players.get(data.playerNo);

    if (!player) {
      this.createPlayer(data.playerNo, data);
      return;
    }

    this.scene.tweens.add({
      targets: player,
      duration: 100,
      ease: 'Linear',
    });

    player.nonLocalMove({
      x: data.x,
      y: data.y,
      velocityX: data.velocityX,
      velocityY: data.velocityY,
    });

    if (Math.abs(player.x - data.x) > 3 || Math.abs(player.y - data.y) > 3) {
      player.setPosition(data.x, data.y);
    }
  }

  update() {
    this.localPlayer?.move();
  }
}
