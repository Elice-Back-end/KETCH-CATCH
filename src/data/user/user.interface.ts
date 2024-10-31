export interface User {
   nickname: string;
   socketId: string;
   avatar: {
      eye: string;
      body: string;
   };
   isHost: boolean;
}
