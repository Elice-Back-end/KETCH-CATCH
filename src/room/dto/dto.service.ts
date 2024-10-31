import { Injectable } from "@nestjs/common";
import { userDto } from "./user.dto";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { AppGateway } from "src/app.gateway";
import { roomSettingDto } from "./room-setting.dto";
import { passwordDto } from "./password.dto";

@Injectable()
export class DtoService {
   constructor(private appGateway: AppGateway) {}
   // user DTO 유효성 검증 로직
   async userValidData(userData: userDto) {
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
            this.appGateway.handleError(err);
            return;
         }

         return true;
      } catch (e) {
         this.appGateway.handleError(e);
      }
   }

   // roomSetting DTO 유효성 검증 로직
   async roomValidData(roomData: roomSettingDto) {
      try {
         // DTO 인스턴스 생성
         const roomSetting = plainToClass(roomSettingDto, roomData);
         // 유효성 검사
         const roomSettingError = await validate(roomSetting);

         if (roomSettingError.length > 0) {
            const err = roomSettingError[0].constraints;
            this.appGateway.handleError(err);
            return;
         }
         return true;
      } catch (e) {
         this.appGateway.handleError(e);
      }
   }

   // passwordDto 유효성 검증 로직
   async passwordValidData(passwordData: passwordDto) {
      try {
         // DTO 인스턴스 생성
         const password = plainToClass(passwordDto, { password: passwordData });
         // 유효성 검사
         const passwordError = await validate(password);
         if (passwordError.length > 0) {
            const err = passwordError[0].constraints;
            this.appGateway.handleError(err);
            return;
         }
         return true;
      } catch (e) {
         this.appGateway.handleError(e);
      }
   }
}
