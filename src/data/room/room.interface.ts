export interface Room {
   roomId: string;
   round: number;
   time: number;
   person: number;
   gameMode: string;
   password: string | null;
   hint: boolean;
   isStart: boolean;
}
