import GameAPI from '@/interfaces/gameApi';
import api from '@/api/axios';

export default class ProductionGameAPI implements GameAPI {
  private roomId: number;

  constructor(roomId) {
    this.roomId = roomId;
  }

  async createGame(): Promise<BaseResponse> {
    try {
      const response = await api.get(`/api/game/${this.roomId}/start`);
      return response.data;
    } catch (error) {
      console.error(error);
      return new Error(error.message);
    }
  }

  async getGameData(): Promise<GameData> {
    try {
      const response = await api.get(`/api/game/${this.roomId}`);
      return response.data;
    } catch (error) {
      console.error(error);
      return new Error(error.message);
    }
  }

  async getGameStatus(): Promise<GameStatus> {
    try {
      const response = await api.get(`/api/game/${this.roomId}/status`);
      return response.data;
    } catch (error) {
      console.error(error);
      return new Error(error.message);
    }
  }

  async deleteGame(): Promise<boolean> {
    try {
      const response = await api.delete(`/api/game/${this.roomId}`);
      return response.data.isSuccess;
    } catch (error) {
      console.error(error);
      return new Error(error.message);
    }
  }

  async vote(targetId: number): Promise<BaseResponse> {
    try {
      const response = await api.post(`/api/game/${this.roomId}/vote?targetId=${targetId}`);
      return response.data;
    } catch (error) {
      console.error(error);
      return new Error(error.message);
    }
  }

  async getGameEndState(): Promise<GameEndState> {
    try {
      const response = await api.get(`/api/game/${this.roomId}/isEnd`);
      return response.data;
    } catch (error) {
      console.error(error);
      return new Error(error.message);
    }
  }
}
