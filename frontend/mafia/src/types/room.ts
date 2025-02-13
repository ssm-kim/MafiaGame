export interface Room {
  roomId: number;
  roomTitle: string;
  initParticipantNo: number;
  roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED'; // 문자열 타입으로 통일
  roomOption: string;
  requiredPlayers: number;
  isVoice: boolean;
  createdAt: string;
  peopleCnt: number;
  hostId: number;
  participant: Record<string, Participant>;
  isNight?: boolean;
}

export interface ParticipantsInfo {
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
  roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED'; // Room 인터페이스와 같은 타입으로 변경
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
