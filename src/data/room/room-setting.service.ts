import { Injectable } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { AppGateway } from "src/app.gateway";
import { roomSettingDto } from "src/room/dto/room-setting.dto";
import { Room } from "./room.interface";

@Injectable()
export class RoomSettingService {
   constructor(private appGateway: AppGateway) {}
   room: Room[] = [];
   // roomSetting DTO 유효성 검증 로직
   async validData(roomData: roomSettingDto) {
      try {
         // DTO 인스턴스 생성
         const roomSetting = plainToClass(roomSettingDto, roomData);
         // 유효성 검사
         const roomSettingError = await validate(roomSetting);

         if (roomSettingError.length > 0) {
            const err = roomSettingError[0].constraints;
            return this.appGateway.handleError(err);
         }
         return true;
      } catch (e) {
         this.appGateway.handleError(e);
      }
   }

   // 방 등록
   registerRoom(roomData: Room) {
      this.room.push(roomData);
   }

   // 방 조회
   findOneRoom(roomId: string): Room {
      return this.room.find((room) => room.roomId === roomId);
   }
}
