// export interface User {
//     id: string;
//     username: string;
//     nickname: string;
//     password: string;
//   }

// types/user.ts
export interface User {
  username: string;
  password: string;
}

export interface LoginResponse {
  memberId: number;
  nickname: string;
}
