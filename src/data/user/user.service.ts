import { Injectable } from "@nestjs/common";
import { User } from "./user.interface";

@Injectable()
export class UserService {
   users: User[] = [];
   // 사용자 등록
   register(userData: User) {
      this.users.push(userData);
   }
}
