export interface User {
   nickname: string;
   socketId: string;
   avatar: {
      eye: string;
      body: string;
   };
   roomId: string;
   isHost: boolean;
   isCheck: boolean; // 비밀번호 체크 여부
}
