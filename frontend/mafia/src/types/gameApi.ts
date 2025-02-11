import PlayerRole from '@/types/role';
import { GamePhases } from '@/types/game';

interface BaseResponse {
  isSuccess: boolean;
  code: number;
  message: string;
  result: string;
}

interface PlayerInfo {
  userId: number;
  nickname: string;
  role: PlayerRole;
  enableVote: boolean;
  dead: boolean;
}

interface GameData extends BaseResponse {
  result: {
    players: Map<string, PlayerInfo>;
  };
}

// DAY_DISCUSSION, 낮 - 토
// DAY_VOTE,       낮 - 투표
// DAY_FINAL_STATEMENT, 낮 - 변론
// DAY_FINAL_VOTE, 낮 - 최종 투표
// NIGHT_ACTION    밤 - 행동 선택

interface GameStatus extends BaseResponse {
  result: {
    currentphase: GamePhases;
    remainingtime: number;
  };
}

interface GameEndState extends BaseResponse {
  result: {
    ex: 'PLAYING' | 'CITIZEN_WIN' | 'ZOMBIE_WIN' | 'MUTANT_WIN';
  };
}

export default interface GameAPI {
  createGame(): Promise<BaseResponse>;
  getGameData(): Promise<GameData>;
  getGameStatus(): Promise<GameStatus>;
  deleteGame(): Promise<boolean>;
  vote(targetId: number): Promise<BaseResponse>;
  getVoteResult(): Promise<BaseResponse>;
  getGameEndState(): Promise<GameEndState>;
}
