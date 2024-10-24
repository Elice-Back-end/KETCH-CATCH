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
}
