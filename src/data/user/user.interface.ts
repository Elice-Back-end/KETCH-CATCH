export interface User {
   nickname: string;
   socketId: string;
   character: {
      eye: string;
      color: string;
      ghost: string;
   };
   roomId: string;
   isHost: boolean;
   isCheck: boolean; // 비밀번호 체크 여부
}
