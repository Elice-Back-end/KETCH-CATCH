export interface User {
   nickname: string;
   socketId: string;
   character: {
      eye: string;
      color: string;
      ghost: string;
   };
   isHost: boolean;
   score: number;
   isDrawing: boolean;
}
