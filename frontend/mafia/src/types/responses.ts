export interface GameStartResponse {
  roomId: number;
  hostId: number;
  readyCnt: number;
  roomStatus: boolean;
  participant: {
    [key: string]: {
      memberId: number;
      nickName: string;
      ready: boolean;
    };
  };
  gameOption: {
    zombie: number;
    mutant: number;
    doctorSkillUsage: number;
    nightTimeSec: number;
    dayDisTimeSec: number;
    requiredPlayers: number;
  };
  maxPlayer?: number;
}
