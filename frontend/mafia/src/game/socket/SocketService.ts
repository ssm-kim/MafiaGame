import { Stomp } from '@stomp/stompjs';

import Phaser from 'phaser';
import { PlayerData } from '@/types/game';

export default class SocketService {
  constructor() {
    this.stompClient = null;
    this.events = new Phaser.Events.EventEmitter();
    this.baseUrl = import.meta.env.VITE_GAME_SOCKET_URL;
  }

  connect(roomId) {
    if (this.stompClient) {
      this.disconnect();
    }

    this.roomId = roomId;

    const socket = new WebSocket(`${this.baseUrl}/mafia-game-ws`);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, () => {
      console.log('Connected to WebSocket');

      this.setupSubscriptions();

      this.events.emit('CONNECTED');
    });
  }

  setupSubscriptions() {
    // 게임 시작 구독
    this.stompClient.subscribe(`/topic/game/${this.roomId}/start`, (message) => {
      const positions = JSON.parse(message.body);
      this.events.emit('PLAYER_JOINED', positions);
    });

    // 위치 업데이트 구독
    this.stompClient.subscribe(`/topic/game/${this.roomId}/positions`, (message) => {
      const positions = JSON.parse(message.body);
      this.events.emit('PLAYER_DATA_UPDATED', positions);
    });
  }

  sendPosition(playerData: PlayerData) {
    if (this.stompClient && this.stompClient.connected) {
      const data = {
        memberId: playerData.memberId,
        character: playerData.character,
        x: playerData.x,
        y: playerData.y,
        velocityX: playerData.velocityX,
        velocityY: playerData.velocityY,
        lastDirection: playerData.lastDirection,
      };

      this.stompClient.send(`/app/game/${this.roomId}/pos`, {}, JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
  }
}
