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

// export interface GameStartResponse {
//   roomId: number;
//   roomTitle: string;
//   roomOption: string;
//   maxPlayers: number;
//   isVoice: boolean;
//   peopleCnt: number;
//   maxPlayer?: number;
// }

// export interface GameStartResponse {
//   roomId: number;
//   hostId: number;
//   readyCnt: number;
//   roomStatus: boolean;
//   participant: {
//     [key: string]: {
//       memberId: number;
//       nickName: string;
//       ready: boolean;
//     };
//   };
//   gameOption: GameOption;
// }

// export interface GameOption {
//   zombie: number;
//   mutant: number;
//   doctorSkillUsage: number;
//   nightTimeSec: number;
//   dayDisTimeSec: number;
//   requiredPlayers: number;
// }
