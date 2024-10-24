import { Injectable } from "@nestjs/common";
import { userDto } from "./dto/user.dto";
import { roomSettingDto } from "./dto/room-setting.dto";
import { UserService } from "src/data/user/user.service";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { nanoid } from "nanoid";

@Injectable()
export class RoomService {
   constructor(
      private userService: UserService,
      private roomSettingService: RoomSettingService,
   ) {}
   async createRoom(data: { user: userDto; roomSetting: roomSettingDto }) {
      const err = await Promise.all([
         this.userService.validData(data.user),
         this.roomSettingService.validData(data.roomSetting),
      ]);

      if (err.every((result) => result !== undefined) === false) return; // dto 유효성 검증 오류가 발생한 경우

      const roomId = nanoid(); // 랜덤한 roomId 생성
      const payload: { host: string; roomId: string; message: string } = {
         host: data.user.socketId,
         roomId,
         message: "방이 생성되었습니다.",
      };

      this.userService.register({ ...data.user, roomId, isHost: true });
      return { roomId, payload };
   }
}
