import { Injectable } from "@nestjs/common";
import { User } from "./user.interface";
@Injectable()
export class UserService {
   users: Map<string, User[]> = new Map();

   initialRoom(roomId: string) {
      this.users.set(roomId, []);
   }

   // 사용자 등록
   register(roomId: string, userData: User) {
      // roomId를 안 가지고 있다면
      if (this.users.has(roomId) === false) {
         // 빈 배열로 초기화
         this.users.set(roomId, []);
      }
      this.users.get(roomId)!.push(userData);
   }

   // 특정 방에 속한 사용자들 조회
   findUsers(roomId: string) {
      return this.users.get(roomId);
   }

   // 사용자 조회
   findOneUser(roomId: string, socketId: string) {
      const users = this.findUsers(roomId);
      return users.find((user) => user.socketId === socketId);
   }

   // 유저 제거
   deleteUser(roomId: string, socketId: string) {
      const remainUsers = this.users.get(roomId).filter((user) => user.socketId !== socketId);
      this.users.set(roomId, remainUsers);
   }
}
