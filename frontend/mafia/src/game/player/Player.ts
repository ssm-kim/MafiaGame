import { CompatClient } from '@stomp/stompjs';
import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  scene: Phaser.Scene;

  playerData: PlayerData;

  isStop: boolean = true;

  static TEXTURE_MAPPING = {
    left: 3,
    right: 9,
    up: 6,
    down: 0,
  };

  constructor(scene, playerData) {
    super(scene, playerData.x || 36, playerData.y || 200, playerData.character);

    this.SPEED = 100;
    this.NICKNAME_OFFSET_Y = 30;

    this.scene = scene;
    this.playerData = playerData;
    this.isLocal = playerData.isLocal;
    this.character = playerData.character;
    this.lastDirection = 'down';

    this.initializePlayer(playerData);
  }

  initializePlayer(playerData) {
    if (!this.character) {
      console.error('No character specified');
      this.character = 'character1';
    }

    try {
      this.setTexture(this.character, Player.TEXTURE_MAPPING[this.lastDirection]);
      this.createNicknameText(playerData.nickname);
      this.setupPhysics();
      this.createAnimations(); // 애니메이션 초기 생성

      if (playerData.isLocal) {
        this.setupCamera();
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.shift = this.scene.input.keyboard.addKey('SHIFT');
      }
    } catch (error) {
      console.error('Texture error:', error);
      this.setTexture('character1', Player.TEXTURE_MAPPING[this.lastDirection]);
    }
  }

  createAnimations() {
    if (!this.scene || !this.scene.anims) return;

    const directions = ['left', 'right', 'up', 'down'];
    const frames = {
      left: [3, 4, 5],
      right: [9, 10, 11],
      up: [6, 7, 8],
      down: [0, 1, 2],
    };

    directions.forEach((direction) => {
      const animKey = `${this.character}_${direction}`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(this.character, {
            frames: frames[direction],
          }),
          frameRate: 10,
          repeat: -1,
        });
      }
    });
  }

  setupPhysics() {
    if (!this.scene) return;

    // 기존 physics body가 있다면 제거
    if (this.body) {
      this.scene.physics.world.remove(this.body);
    }

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.scale = 1.5;
    this.setPushable(false);
    this.setCollideWorldBounds(true);
    this.setCollideObject('locker');
    this.setBodySize(16, 15);
    this.setOffset(8, 45);
    this.setGroupDepth();
  }

  setGroupDepth() {
    this.setDepth(this.y);
    this.nicknameText.setDepth(this.y);
  }

  setCollideObject(objectKey) {
    const objectList = this.scene.children.list.filter((item) => item.name === objectKey);

    if (objectList) {
      objectList.forEach((object) => {
        this.scene.physics.add.collider(this, object);
      });
    }
  }

  createNicknameText(nickname) {
    this.nicknameText = this.scene.add.text(this.x, this.y - this.NICKNAME_OFFSET_Y, nickname, {
      padding: { x: 6, y: 4 },
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });
    this.nicknameText.setOrigin(0.5);
  }

  setupCamera() {
    const camera = this.scene.cameras.main;
    camera.startFollow(this, true);
    camera.setBounds(0, 0, 932, 610);
    camera.setZoom(1);
  }

  move() {
    if (!this.scene || !this.body) return; // 추가된 안전 검사

    const movement = this.calculateMovement();

    if (movement.velocityX || movement.velocityY) {
      this.isStop = false;
    }

    this.sendPosition(movement);

    if (movement.velocityX === 0 && movement.velocityY === 0) {
      this.isStop = true;
    }

    this.nonLocalMove(movement);
  }

  nonLocalMove(movement) {
    this.updatePosition(movement);
    this.updateAnimation();
    this.nicknameText.setPosition(this.x, this.y - this.NICKNAME_OFFSET_Y);
    this.setGroupDepth();
  }

  calculateMovement() {
    const { left, right, up, down } = this.cursors;
    const { shift } = this;

    return {
      velocityX: this.calculateVelocityX(left.isDown, right.isDown, shift.isDown),
      velocityY: this.calculateVelocityY(up.isDown, down.isDown, shift.isDown),
    };
  }

  calculateVelocityX(isLeftCursorDown, isRightCursorDown, isShiftDown) {
    let velocityX = 0;

    if (isLeftCursorDown) {
      velocityX = -this.SPEED;
    }
    if (isRightCursorDown) {
      velocityX = this.SPEED;
    }
    if (isShiftDown) {
      velocityX *= 2;
    }

    return velocityX;
  }

  calculateVelocityY(isUpCursorDown, isDownCursorDown, isShiftDown) {
    let velocityY = 0;

    if (isUpCursorDown) {
      velocityY = -this.SPEED;
    }
    if (isDownCursorDown) {
      velocityY = this.SPEED;
    }
    if (isShiftDown) {
      velocityY *= 2;
    }

    return velocityY;
  }

  updatePosition(movement) {
    this.setVelocity(movement.velocityX, movement.velocityY);
    this.setLastDirection(movement);
    if (this.isMoving()) {
      this.nicknameText.setPosition(this.x, this.y - this.NICKNAME_OFFSET_Y);
    }
  }

  setLastDirection(movement) {
    if (movement.velocityX < 0) this.lastDirection = 'left';
    if (movement.velocityX > 0) this.lastDirection = 'right';
    if (movement.velocityY < 0) this.lastDirection = 'up';
    if (movement.velocityY > 0) this.lastDirection = 'down';
  }

  isMoving() {
    return this.body.velocity.x !== 0 || this.body.velocity.y !== 0;
  }

  updateAnimation() {
    if (!this.scene || !this.scene.anims) return;

    if (this.isMoving()) {
      const animKey = `${this.character}_${this.lastDirection}`;

      // 현재 재생 중인 애니메이션과 다른 경우에만 새로운 애니메이션 시작
      if (!this.anims.isPlaying || this.anims.currentAnim?.key !== animKey) {
        this.play(animKey, true);
      }
    } else {
      // 움직임이 없을 때는 정적 프레임으로 설정
      this.stop();
      this.setFrame(Player.TEXTURE_MAPPING[this.lastDirection]);
    }
  }

  sendPosition(movement) {
    if (!this.isStop) {
      const roomId = this.scene.registry.get('roomId');

      const updatedPlayerData = {
        playerNo: this.playerData.playerNo,
        character: this.playerData.character,
        x: this.x,
        y: this.y,
        velocityX: movement.velocityX,
        velocityY: movement.velocityY,
        lastDirection: this.lastDirection,
      };

      const stompClient: CompatClient = this.scene.registry.get('stompClient');
      stompClient.send(`/app/game/${roomId}/pos`, {}, JSON.stringify(updatedPlayerData));
    }
  }

  destroy(fromScene?: boolean) {
    try {
      // 닉네임 텍스트 정리
      if (this.nicknameText && this.nicknameText.scene) {
        this.nicknameText.destroy();
        this.nicknameText = null;
      }

      // physics body 정리
      if (this.body && this.scene) {
        this.scene.physics.world.remove(this.body);
      }

      // 이벤트 리스너 정리
      if (this.cursors) {
        this.cursors = null;
      }
      if (this.shift) {
        this.shift = null;
      }

      // 부모 클래스의 destroy 호출
      if (this.scene) {
        super.destroy(fromScene);
      }
    } catch (error) {
      console.error('Player destroy error:', error);
    }
  }
}
