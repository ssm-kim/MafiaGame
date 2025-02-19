export interface MyInfo {
  playerNo: number;
  nickname: string;
  subscriptions: string[];
  isDead: boolean;
  role: string;
  muteAudio: boolean;
  muteMic: boolean;
  openviduToken: string;
}

export interface Room {
  roomId: number;
  roomTitle: string;
  initParticipantNo: number;
  roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
  roomOption: string;
  requiredPlayers: number;
  isVoice: boolean;
  password?: string;
  createdAt: string;
  peopleCnt: number;
  hostId: number;
  hasPassword: boolean;
  participant: Record<string, Participant>;
  isNight?: boolean;
  myInfo?: MyInfo;
}

export interface GameStart {
  gameStart: string;
}

export interface ParticipantMap {
  [key: number]: Participant;
}

export interface Participant {
  participantNo: number;
  nickName: string;
  ready: boolean;
  subscriptions?: string[];
  isDead?: boolean;
}

export interface GameStartResponse {
  roomId: number;
  hostId: number;
  readyCnt: number;
  roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
  participant: Record<string, Participant>;
  gameOption: {
    maxPlayer: number;
    zombie: number;
    mutant: number;
    doctorSkillUsage: number;
    nightTimeSec: number;
    dayDisTimeSec: number;
    requiredPlayers: number;
  };
}

// export interface Room {
//   roomId: number;
//   roomTitle: string;
//   initParticipantNo: number;
//   roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
//   roomOption: string;
//   requiredPlayers: number;
//   isVoice: boolean;
//   password?: string;
//   createdAt: string;
//   peopleCnt: number;
//   hostId: number;
//   hasPassword: boolean;
//   participant: Record<string, Participant>;
//   isNight?: boolean;
// }

// export interface GameStart {
//   gameStart: string;
// }

// export interface ParticipantMap {
//   [key: number]: Participant;
// }

// export interface Participant {
//   participantNo: number;
//   nickName: string;
//   ready: boolean;
//   subscriptions?: string[];
//   isDead?: boolean;
// }

// export interface GameStartResponse {
//   roomId: number;
//   hostId: number;
//   readyCnt: number;
//   roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED'; // Room 인터페이스와 같은 타입으로 변경
//   participant: Record<string, Participant>;
//   gameOption: {
//     maxPlayer: number;
//     zombie: number;
//     mutant: number;
//     doctorSkillUsage: number;
//     nightTimeSec: number;
//     dayDisTimeSec: number;
//     requiredPlayers: number;
//   };
// }
