export interface User {
   readonly id: number;
   readonly nickName: string;
   readonly score: number;
}
export interface Users {
   users: User[];
}
