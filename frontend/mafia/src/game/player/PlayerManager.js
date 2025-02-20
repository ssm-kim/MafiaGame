import Player from '@/game/player/Player';

export default class PlayerManager {
  constructor(scene) {
    this.scene = scene;
    this.players = new Map();
    this.localPlayer = null;

    // 소켓 이벤트 구독
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    const { events } = this.scene.socketService;

    events.on('PLAYER_CONNECTED', this.handleLocalPlayer.bind(this));

    events.on('ALL_PLAYERS', this.handleAllPlayers.bind(this));

    events.on('NEW_PLAYER_JOINED', this.handleNewPlayer.bind(this));

    events.on('PLAYER_MOVED', this.handlePlayerMovement.bind(this));

    events.on('PLAYER_LEFT', this.handlePlayerDisconnect.bind(this));
  }

  handleLocalPlayer(playerData) {
    const { role, character } = this.scene.registry.get('playerInfo');
    this.localPlayer = new Player(this.scene, playerData.x, playerData.y, character);
    this.players.set(playerData.socketId, this.localPlayer);
  }

  handleAllPlayers(players) {
    players.forEach((playerData) => {
      if (playerData.socketId === this.scene.socketService.socket.id) return;
      this.handleNewPlayer(playerData);
    });
  }

  handleNewPlayer(playerData) {
    const player = new Player(this.scene, playerData.x, playerData.y, playerData.character);
    this.players.set(playerData.socketId, player);
  }

  handlePlayerMovement(playerData) {
    const player = this.players.get(playerData.socketId);

    if (player) {
      player.setVelocity(playerData.velocityX, playerData.velocityY);

      if (playerData.velocityX === 0 && playerData.velocityY === 0) {
        player.stop(playerData.lastDirection);
        return;
      }

      player.anims.play(`${playerData.character}_${playerData.lastDirection}`, true);
    }
  }

  handlePlayerDisconnect(playerData) {
    console.log(playerData);
    const player = this.players.get(playerData.socketId);
    if (player) {
      player.destroy();
      this.players.delete(playerData.socketId);
    }
  }

  update() {
    this.localPlayer?.move();
  }
}
