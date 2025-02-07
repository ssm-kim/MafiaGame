export interface Room {
  roomId: number;
  roomTitle: string;
  roomStatus: boolean; // false(대기방), true(게임 진행 중)
  roomOption: string;
  maxPlayers: number;
  isVoice: boolean;
  createdAt: string;
  curPlayers: number;
  hostId: number;
  participant: Record<string, Participant>;
}

export interface Participant {
  memberId: number;
  nickName: string;
  ready: boolean;
}

export interface GameStartResponse {
  roomId: number;
  hostId: number;
  readyCnt: number;
  roomStatus: boolean;
  participant: Record<string, Participant>;
  gameOption: {
    maxPlayers: number;
    zombie: number;
    mutant: number;
    doctorSkillUsage: number;
    nightTimeSec: number;
    dayDisTimeSec: number;
    requiredPlayers: number;
  };
}

export interface TestGameHeaderProps {
  roomId: string;
  gameState: Room | null;
  onLeave: () => Promise<void>;
  onReady: () => Promise<void>;
  onStart: () => Promise<void>;
  isHost: boolean;
}
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

// export interface Room {
//   roomId: number;
//   roomTitle: string;
//   roomStatus: boolean; // false(대기방), true(게임 진행 중)
//   roomOption: string;
//   maxPlayers: number;
//   isVoice: boolean;
//   createdAt: string;
//   curPlayers: number;
//   hostId: number;
//   participant: Record<string, Participant>;
//   maxPlayer?: number;
// }

// interface Participant {
//   memberId: number;
//   nickName: string;
//   ready: boolean;
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
//   gameOption: {
//     zombie: number;
//     mutant: number;
//     doctorSkillUsage: number;
//     nightTimeSec: number;
//     dayDisTimeSec: number;
//     requiredPlayers: number;
//   };
// }

// interface TestGameHeaderProps {
//   roomId: string;
//   gameState: Room | null;
//   onLeave: () => Promise<void>;
//   onReady: () => Promise<void>; // 추가
//   onStart: () => Promise<void>;
//   isHost: boolean;
// }
