import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key) {
    super(scene, x, y, key);

    // Scene과 입력 객체 저장
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.lastDirection = 'down';
    this.character = key;

    // Scene에 추가 및 물리 엔진에 등록
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    // 플레이어 속성 설정
    this.setCollideWorldBounds(true); // 월드 경계 충돌
    this.setBodySize(20, 35);
    this.setOffset(6, 25);

    // Socket 서비스 설정
    this.lastEmitTime = 0;
    this.emitInterval = 1;
  }

  // 업데이트 메서드 (Scene에서 호출)
  move() {
    const speed = 100;
    this.velocityX = 0;
    this.velocityY = 0;

    if (this.cursors.left.isDown) {
      this.velocityX = -speed;
      this.anims.play(`${this.character}_left`, true);
      this.lastDirection = 'left';
    } else if (this.cursors.right.isDown) {
      this.velocityX = speed;
      this.anims.play(`${this.character}_right`, true);
      this.lastDirection = 'right';
    } else if (this.cursors.up.isDown) {
      this.velocityY = -speed;
      this.anims.play(`${this.character}_up`, true);
      this.lastDirection = 'up';
    } else if (this.cursors.down.isDown) {
      this.velocityY = speed;
      this.anims.play(`${this.character}_down`, true);
      this.lastDirection = 'down';
    } else {
      this.stop(this.lastDirection);
    }

    // 속도 적용
    this.setVelocity(this.velocityX, this.velocityY);

    // 이동 정보 전송
    const currentTime = Date.now();

    if (currentTime - this.lastEmitTime > this.emitInterval) {
      this.scene.socketService.emitMovement({
        room: this.scene.registry.get('roomId'),
        socketId: this.scene.socketService.socket.id,
        x: this.x,
        y: this.y,
        velocityX: this.velocityX,
        velocityY: this.velocityY,
        character: this.character || null,
        lastDirection: this.lastDirection,
      });
    }

    this.lastEmitTime = currentTime;
  }

  stop(lastDirection) {
    const textureMapping = {
      left: 3,
      right: 9,
      up: 6,
      down: 0,
    };

    if (textureMapping[lastDirection] !== undefined) {
      this.setTexture(this.texture.key, textureMapping[lastDirection]);
    }
  }

  die() {
    this.destroy();
  }
}
