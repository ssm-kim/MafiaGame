
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
  memberId: number;
  roomTitle: string;
  roomStatus: boolean;  // false(대기방), true(게임 진행 중)
  roomOption: string;
  maxPlayers: number;
  isVoice: boolean;
  createdAt: string;
  curPlayers: number;
}