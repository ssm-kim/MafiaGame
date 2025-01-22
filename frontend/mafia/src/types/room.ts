
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
    id: string;
    name: string;
    currentPlayers: number;
    maxPlayers: number;
    gameStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
    password?: string;
    mafia?: number;
    police?: number;
    doctor?: number;
    dayTime?: number;
    nightTime?: number;
    voteTime?: number;
  }