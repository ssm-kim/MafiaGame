import Player from '@/game/player/Player';
import { PlayerData } from '@/types/game';

export default class PlayerManager {
  localPlayerInfo: PlayerData;

  constructor(scene, localPlayerInfo) {
    this.scene = scene;
    this.localPlayerInfo = localPlayerInfo;
    this.players = new Map();
    this.localPlayer = null;

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

    this.setupPhaserEventListeners();
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
    directions.forEach(direction => {
      const animKey = `${player.character}_${direction}`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(player.character, {
            frames: direction === 'left' ? [3, 4, 5] :
                   direction === 'right' ? [9, 10, 11] :
                   direction === 'up' ? [6, 7, 8] : [0, 1, 2]
          }),
          frameRate: 10,
          repeat: -1
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
    if (!this.localPlayerInfo.character) {
      console.warn('Character not specified, using default');
      this.localPlayerInfo.character = 'character1';
    }

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
      if (numericId === this.localPlayerInfo.playerId) return;

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
      this.players.forEach(player => {
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
