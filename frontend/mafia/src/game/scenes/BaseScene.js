import Phaser from 'phaser';

export default class BaseScene extends Phaser.Scene {
  destroy() {
    this.socketService.events.removeAllListeners();
  }
}
