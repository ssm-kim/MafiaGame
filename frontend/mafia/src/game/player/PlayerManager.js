import Player from '@/game/player/Player';

export default class PlayerManager {
  constructor(scene) {
    this.scene = scene;
    this.localPlayerInfo = this.scene.registry.get('playerInfo');

    this.players = new Map();
    this.localPlayer = null;

    this.setupPhaserEventListeners();

    if (this.localPlayerInfo.dead) {
      this.localPlayer = this.createGhostPlayer();
    }

    const previousPlayers = this.scene.registry.get('players');
    if (previousPlayers) {
      this.players = previousPlayers;
      this.localPlayer = this.players.get(this.scene.registry.get('userId'));
      if (this.localPlayer) {
        this.localPlayer.scene = this.scene;
        this.reinitializePlayer(this.localPlayer);
      } else {
        this.createLocalPlayer();
      }
    } else {
      this.createLocalPlayer();
    }
  }

  createGhostPlayer() {
    if (!this.localPlayerInfo.dead) return;

    if (!this.localPlayerInfo.character) {
      console.warn('Character not specified, using default');
      this.localPlayerInfo.character = 'character1';
    }

    const data = {
      ...this.localPlayerInfo,
      nickname: null,
      isLocal: true,
      x: 466,
      y: 400,
      velocityX: 0,
      velocityY: 0,
      lastDirection: 'down',
    };

    const player = new Player(this.scene, data);
    player.setAlpha(0);
    // this.localPlayer = player;
  }

  reinitializePlayer(player) {
    if (!player.character) {
      console.error('No character specified for player');
      return;
    }

    player.scene = this.scene;

    // physics body 재설정
    if (player.body) {
      this.scene.physics.world.remove(player.body);
    }
    this.scene.add.existing(player);
    this.scene.physics.add.existing(player);

    // 애니메이션 재생성
    const directions = ['left', 'right', 'up', 'down'];
    directions.forEach((direction) => {
      const animKey = `${player.character}_${direction}`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(player.character, {
            frames:
              direction === 'left'
                ? [3, 4, 5]
                : direction === 'right'
                  ? [9, 10, 11]
                  : direction === 'up'
                    ? [6, 7, 8]
                    : [0, 1, 2],
          }),
          frameRate: 10,
          repeat: -1,
        });
      }
    });

    player.setupPhysics();
    player.createNicknameText(player.playerData.nickname);

    if (player.isLocal) {
      player.setupCamera();
      player.cursors = this.scene.input.keyboard.createCursorKeys();
      player.shift = this.scene.input.keyboard.addKey('SHIFT');
    }
  }

  setupPhaserEventListeners() {
    const eventEmitter = this.scene.registry.get('eventEmitter');

    eventEmitter.on('PLAYER_DATA_UPDATED', this.updateCharacters.bind(this));
  }

  createLocalPlayer() {
    if (this.localPlayerInfo.dead) return;

    if (!this.localPlayerInfo.character) {
      console.warn('Character not specified, using default');
      this.localPlayerInfo.character = 'character1';
    }

    if (this.localPlayer) return;

    //console.log(this.localPlayerInfo);

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

    const stompClient = this.scene.registry.get('stompClient');
    stompClient.send(`/app/game/${roomId}/pos`, {}, JSON.stringify(data));

    this.players.set(userId, player);
  }

  createPlayer(playerId, playerData) {
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
    const sceneKey = this.scene.scene.key;
    if (sceneKey === 'NightScene') return;
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
    if (this.localPlayer) {
      try {
        if (!this.localPlayer.body || !this.localPlayer.scene) {
          this.reinitializePlayer(this.localPlayer);
        }
        this.localPlayer.move();
      } catch (error) {
        console.error('Update error:', error);
        this.reinitializePlayer(this.localPlayer);
      }
    }
  }

  destroy() {
    try {
      // 모든 플레이어 정리
      this.players.forEach((player) => {
        if (player && player.scene) {
          player.nicknameText?.destroy();
          player.destroy(true);
        }
      });
      this.players.clear();
      this.localPlayer = null;

      // 이벤트 리스너 제거
      const eventEmitter = this.scene.registry.get('eventEmitter');
      eventEmitter.removeListener('PLAYER_DATA_UPDATED', this.updateCharacters);
    } catch (error) {
      console.error('PlayerManager destroy error:', error);
    }
  }
}
