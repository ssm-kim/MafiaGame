import Player from '@/game/player/Player';
import { PlayerData } from '@/types/game';

export default class PlayerManager {
  localPlayerInfo: PlayerData;

  constructor(scene, localPlayerInfo) {
    this.scene = scene;
    this.localPlayerInfo = localPlayerInfo;
    this.players = new Map();
    this.localPlayer = null;

    // 이전 플레이어 데이터 복원
    const previousPlayers = this.scene.registry.get('players');
    if (previousPlayers) {
      this.players = previousPlayers;
      this.localPlayer = this.players.get(this.scene.registry.get('userId'));
      if (this.localPlayer) {
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
    // 씬 참조 업데이트
    player.scene = this.scene;
    
    // 애니메이션 시스템 초기화
    const directions = ['left', 'right', 'up', 'down'];
    const frames = {
      left: [3, 4, 5],
      right: [9, 10, 11],
      up: [6, 7, 8],
      down: [0, 1, 2],
    };

    directions.forEach(direction => {
      const animKey = `${player.character}_${direction}`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(player.character, {
            frames: frames[direction]
          }),
          frameRate: 10,
          repeat: -1,
        });
      }
    });

    // physics body 재설정
    this.scene.add.existing(player);
    this.scene.physics.add.existing(player);
    
    // 기존 설정 복원
    player.setupPhysics();
    player.createNicknameText(player.playerData.nickname);
    
    if (player.isLocal) {
      player.setupCamera();
      player.cursors = this.scene.input.keyboard.createCursorKeys();
      player.shift = this.scene.input.keyboard.addKey('SHIFT');
    }
  }

  setupPhysics() {
    if (this.localPlayer) {
      // 기존 physics body 제거
      if (this.localPlayer.body) {
        this.scene.physics.world.remove(this.localPlayer.body);
      }
  
      // 씬에 플레이어 재추가
      this.scene.add.existing(this.localPlayer);
      this.scene.physics.add.existing(this.localPlayer);
  
      // 애니메이션 초기화
      this.localPlayer.createAnimations();
      
      // 물리 속성 설정
      this.localPlayer.setupPhysics();
    }
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
    // this.scene.socketService.sendPosition(data);
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
    if (this.localPlayer) {
      // physics body나 애니메이션 시스템 확인
      if (!this.localPlayer.body || !this.localPlayer.anims) {
        this.reinitializePlayer(this.localPlayer);
      }
      this.localPlayer.move();
    }
  }
}
