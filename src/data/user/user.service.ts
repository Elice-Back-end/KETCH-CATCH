import { Injectable } from "@nestjs/common";
import { User } from "./user.interface";
import { userDto } from "../../room/dto/user.dto";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { AppGateway } from "src/app.gateway";

@Injectable()
export class UserService {
   users: User[] = [];

   constructor(private appGateway: AppGateway) {}

   // user DTO 유효성 검증 로직
   async validData(userData: userDto) {
      try {
         // DTO 인스턴스 생성
         const user = plainToClass(userDto, userData);
         // 유효성 검사
         const userError = await validate(user);

         if (userError.length > 0) {
            // character 데이터 검증 오류 발생시
            if (userError[0].children.length > 0) {
               const err = userError[0].children[0].constraints;
               return this.appGateway.handleError(err);
            }
            const err = userError[0].constraints;
            return this.appGateway.handleError(err);
         }

         return true;
      } catch (e) {
         this.appGateway.handleError(e);
      }
   }

   // 사용자 등록
   register(userData: User) {
      this.users.push(userData);
   }

   // 특정 방에 속한 사용자들 조회
   findUsers(roomId: string) {
      return this.users.filter((user) => user.roomId === roomId);
   }

   // 사용자 조회
   findOneUser(socketId: string) {
      return this.users.find((user) => user.socketId === socketId);
   }

   // 사용자 제거
   deleteUser(socketId: string) {
      this.users = this.users.filter((user) => user.socketId !== socketId);
   }
}
