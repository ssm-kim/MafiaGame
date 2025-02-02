// export interface Room {
//     id: string;
//     name: string;
//     maxPlayers: number;
//     currentPlayers: number;
//     password?: string;
//     gameStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
//     timePhase?: 'DAY' | 'NIGHT' | 'VOTE';
//     mafia: number;
//     police: number;
//     doctor: number;
//     dayTime: number;
//     nightTime: number;
//     voteTime: number;
//   }
export interface Room {
  roomId: number;
  roomTitle: string;
  peopleCnt: number;
}

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
}
