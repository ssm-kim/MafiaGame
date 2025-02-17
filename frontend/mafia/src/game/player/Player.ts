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
    super(scene, playerData.x || 36, playerData.y || 222, playerData.character);

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
    this.setTexture(this.texture.key, Player.TEXTURE_MAPPING[this.lastDirection]);
    this.createNicknameText(playerData.nickname);
    this.setupPhysics();
    if (playerData.isLocal) {
      this.setupCamera();
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.shift = this.scene.input.keyboard.addKey('SHIFT');
    }
  }

  setupPhysics() {
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
    if (this.isMoving()) {
      this.anims.play(`${this.character}_${this.lastDirection}`, true);
    } else {
      const textureMapping = {
        left: 3,
        right: 9,
        up: 6,
        down: 0,
      };
      this.setTexture(this.texture.key, textureMapping[this.lastDirection]);
      this.anims.stop();
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

  destroy() {
    super.destroy();
    this.nicknameText.destroy();
  }
}
