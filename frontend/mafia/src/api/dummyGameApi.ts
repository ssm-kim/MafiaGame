import GameAPI from '@/interfaces/gameApi';
import DummyData from '@/game/dummyData.json';

export default class DummyGameAPI implements GameAPI {
  private roomId: number;

  private dummyData = DummyData;

  async createGame(): Promise<BaseResponse> {
    return this.dummyData.createGame;
  }

  async getGameData(): Promise<GameData> {
    return this.dummyData.gameData;
  }

  async getGameStatus(): Promise {
    return this.dummyData.gameStatus;
  }

  async vote(targetId: number): Promise<BaseResponse> {
    console.log(targetId);
    return this.dummyData.vote;
  }

  async getGameEndState(): Promise<GameEndState> {
    return this.dummyData.gameEndState;
  }
}
