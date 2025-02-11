import GameAPI from '@/interfaces/gameApi';
import DummyGameAPI from '@/api/dummyGameApi';
import ProductionGameAPI from '@/api/productionGameApi';

export default class GameAPIFactory {
  static create(roomId: number): GameAPI {
    if (import.meta.env.DEV) {
      return new DummyGameAPI(roomId);
    }
    return new ProductionGameAPI(roomId);
  }
}
