import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { roomSettingDto } from "src/data/dto/room-setting.dto";
import { userDto } from "src/data/dto/user.dto";
import { nanoid } from "nanoid";
import { UserService } from "src/data/user/user.service";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { AppGateway } from "src/app.gateway";

@WebSocketGateway({ namespace: "room" })
export class RoomGateway {
   private round: number;
   private time: number;
   private person: number;
   private game_mode: string;
   private password: string | null;
   private hint: boolean;

   constructor(
      private userService: UserService,
      private appGateway: AppGateway,
   ) {
      this.round = 8;
      this.time = 60;
      this.person = 4;
      this.game_mode = "easy mode";
      this.password = null;
      this.hint = false;
   }

   room = [];

   // DTO 유효성 검증 로직
   async validData(data: { user: userDto; roomSetting: roomSettingDto }) {
      try {
         // DTO 인스턴스 생성
         const user = plainToClass(userDto, data.user);
         const roomSetting = plainToClass(roomSettingDto, data.roomSetting);
         // 유효성 검사
         const userError = await validate(user);
         const roomSettingError = await validate(roomSetting);

         if (userError.length > 0) {
            // character 데이터 검증 오류 발생시
            if (userError[0].children.length > 0) {
               const err = userError[0].children[0].constraints;
               return this.appGateway.handleError(err);
            }
            const err = userError[0].constraints;
            return this.appGateway.handleError(err);
         }

         if (roomSettingError.length > 0) {
            const err = roomSettingError[0].constraints;
            return this.appGateway.handleError(err);
         }

         return true;
      } catch (e) {
         this.appGateway.handleError(e);
      }
   }

   @SubscribeMessage("make-room")
   async createRoom(socket: Socket, data: { user: userDto; roomSetting: roomSettingDto }) {
      const err = await this.validData(data);
      if (err === undefined) return; // dto 유효성 검증 오류가 발생한 경우

      const roomId = nanoid(); // 랜덤한 roomId 생성
      const payload: { host: string; roomId: string; message: string } = {
         host: data.user.socketId,
         roomId,
         message: "방이 생성되었습니다.",
      };

      this.room.push({ roomId, ...data.roomSetting });
      this.userService.register({ ...data.user, isHost: true, score: 0, isDrawing: false });
      // room 입장
      socket.join(roomId);
      socket.to(roomId).emit("made-room", payload);
   }
}
