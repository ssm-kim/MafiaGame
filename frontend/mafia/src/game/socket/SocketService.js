import { io } from 'socket.io-client';
import Phaser from 'phaser';

export default class SocketService {
  constructor(uri) {
    this.socket = io(uri, { cors: { origin: '*' } });
    this.events = new Phaser.Events.EventEmitter();
  }

  setupSocketEvents() {
    // this.socket.emit('joinroom', { room: roomId, character: 'character1' });

    this.socket.on('playerjoined', (playerData) => {
      this.initPlayer = playerData;
      this.events.emit('PLAYER_CONNECTED', playerData);
    });

    this.socket.on('allplayers', (playersData) => {
      console.log('allplayers', playersData);
      this.events.emit('ALL_PLAYERS', playersData);
    });

    this.socket.on('newplayer', (playerData) => {
      console.log('newplayer', playerData);
      this.events.emit('NEW_PLAYER_JOINED', playerData);
    });

    this.socket.on('playermoved', (playerData) => {
      this.events.emit('PLAYER_MOVED', playerData);
    });

    this.socket.on('playerleft', (playerId) => {
      this.events.emit('PLAYER_LEFT', playerId);
    });
  }

  emitMovement(playerData) {
    this.socket.emit('playermoved', playerData);
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }
}
