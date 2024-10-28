export interface User {
   readonly id: number;
   readonly name: string;
   readonly score: number;
   readonly avatar: {
      eye: string;
      body: string;
   };
}
